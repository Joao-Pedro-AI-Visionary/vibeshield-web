import { expect, test } from "@playwright/test";
import { API, SAMPLE, mockScanError, mockScanOk } from "./helpers";

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

test("fluxo feliz: digitar URL, escanear, ver score, filtrar e copiar", async ({ page }) => {
  const bodies = await mockScanOk(page);
  await page.goto("/");
  await expect(page.getByTestId("empty-state")).toBeVisible();

  await page.getByLabel("URL do repositório GitHub").fill("https://github.com/acme/vibe-app");
  await page.getByTestId("scan-button").click();

  await expect(page.getByTestId("score")).toHaveText(String(SAMPLE.score));
  await expect(page.getByTestId("grade")).toContainText(SAMPLE.grade);
  await expect(page.getByTestId("repo-name")).toHaveText("acme/vibe-app");
  expect(bodies[0]).toEqual({ repo_url: "https://github.com/acme/vibe-app", check_dependencies: true });

  await expect(page.getByTestId("finding")).toHaveCount(SAMPLE.findings.length);
  const chip = page.getByTestId("filter-category-INSECURE_CODE");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("finding")).toHaveCount(3);

  await page.getByTestId("copy-prompt").first().click();
  await expect(page.getByTestId("copy-prompt").first()).toContainText("Copiado");
  await expect(page.getByTestId("copy-status")).toContainText("Copiado");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe(SAMPLE.findings.find((f) => f.category === "INSECURE_CODE")!.fix_prompt);

  await page.getByTestId("copy-all").click();
  const all = await page.evaluate(() => navigator.clipboard.readText());
  for (const f of SAMPLE.findings) expect(all).toContain(f.fix_prompt);

  // histórico salvo e navegação pelas abas
  await page.getByTestId("nav-historico").click();
  await expect(page.getByRole("heading", { name: "Histórico" })).toBeVisible();
  await expect(page.getByTestId("history-item")).toHaveCount(1);
  await page.getByTestId("nav-metodologia").click();
  await expect(page.getByTestId("rule")).toHaveCount(10);
  await page.getByTestId("nav-historico").click();
  await page.getByTestId("history-item").first().click();
  await expect(page.getByTestId("score")).toHaveText(String(SAMPLE.score));
});

test("URL inválida mostra erro inline sem chamar a API", async ({ page }) => {
  let called = false;
  await page.route(`${API}/scans`, (route) => {
    called = true;
    return route.abort();
  });
  await page.goto("/");
  await page.getByLabel("URL do repositório GitHub").fill("https://github.com/acme/app/tree/main");
  await page.getByTestId("scan-button").click();
  await expect(page.locator("#repo-url-error")).toBeVisible();
  await expect(page.getByLabel("URL do repositório GitHub")).toHaveAttribute("aria-invalid", "true");
  expect(called).toBe(false);
});

test("erro 404 mostra card de erro e tentar de novo funciona", async ({ page }) => {
  await mockScanError(page, 404, "REPO_NOT_FOUND");
  await page.goto("/");
  await page.getByLabel("URL do repositório GitHub").fill("https://github.com/acme/nao-existe");
  await page.getByTestId("scan-button").click();
  await expect(page.getByTestId("error-state")).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Repositório não encontrado");

  await page.unroute(`${API}/scans`);
  await mockScanOk(page);
  await page.getByTestId("retry").click();
  await expect(page.getByTestId("score")).toHaveText(String(SAMPLE.score));
});

test("API fora do ar mostra mensagem de rede", async ({ page }) => {
  await page.route(`${API}/scans`, (route) => route.abort("connectionrefused"));
  await page.goto("/");
  await page.getByTestId("example-repo").first().click();
  await expect(page.getByTestId("error-message")).toContainText("API fora do ar");
});

test("carregando: botão desabilitado com 'Escaneando…' e skeleton", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(`${API}/scans`, async (route) => {
    await gate;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SAMPLE) });
  });
  await page.goto("/");
  await page.getByLabel("URL do repositório GitHub").fill("https://github.com/acme/vibe-app");
  await page.getByTestId("scan-button").click();
  await expect(page.getByTestId("scan-button")).toBeDisabled();
  await expect(page.getByTestId("scan-button")).toHaveText(/Escaneando…/);
  await expect(page.getByTestId("loading-state")).toBeVisible();
  release();
  await expect(page.getByTestId("score")).toBeVisible();
});

test("sem achados mostra estado positivo", async ({ page }) => {
  const clean = {
    ...SAMPLE,
    scan_id: "clean-1",
    score: 100,
    grade: "A",
    summary: {
      by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
      by_category: { SECRET: 0, HIDDEN_UNICODE: 0, SLOPSQUATTING: 0, INSECURE_CODE: 0 },
    },
    findings: [],
  };
  await page.route(`${API}/scans`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(clean) }),
  );
  await page.goto("/");
  await page.getByLabel("URL do repositório GitHub").fill("https://github.com/acme/limpo");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("no-findings")).toBeVisible();
  await expect(page.getByTestId("copy-all")).toBeDisabled();
});

test("1440px: a página não cresce além do bento (lista de achados rola por dentro)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockScanOk(page);
  await page.goto("/");
  await page.getByLabel("URL do repositório GitHub").fill("https://github.com/acme/vibe-app");
  await page.getByTestId("scan-button").click();
  await expect(page.getByTestId("score")).toBeVisible();
  const { docH, bentoBottom } = await page.evaluate(() => ({
    docH: document.documentElement.scrollHeight,
    bentoBottom: document.querySelector("[data-testid=result]")!.getBoundingClientRect().bottom + window.scrollY,
  }));
  expect(docH).toBeLessThanOrEqual(bentoBottom + 40);
});

test("375px: sem scroll horizontal em todas as abas", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockScanOk(page);
  await page.goto("/");
  const noHScroll = async () => {
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw);
  };
  await noHScroll();
  await page.getByLabel("URL do repositório GitHub").fill("https://github.com/acme/vibe-app");
  await page.getByTestId("scan-button").click();
  await expect(page.getByTestId("score")).toBeVisible();
  await noHScroll();
  // conteúdo rola até o fim (nada preso por overflow hidden)
  await page.getByTestId("copy-all").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("copy-all")).toBeInViewport();
  await page.getByTestId("nav-metodologia").click();
  await noHScroll();
  await page.getByTestId("rule").last().scrollIntoViewIfNeeded();
  await expect(page.getByTestId("rule").last()).toBeInViewport();
  await page.getByTestId("nav-historico").click();
  await noHScroll();
});
