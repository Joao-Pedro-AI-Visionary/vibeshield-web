import { describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import FindingsCard from "../../src/components/FindingsCard.vue";
import type { Finding, ScanSummary } from "../../src/api/types";
import sample from "../../e2e/fixtures/scan.json";

const findings = sample.findings as Finding[];
const summary = sample.summary as ScanSummary;

function setup() {
  return mount(FindingsCard, { props: { findings, summary } });
}

describe("FindingsCard", () => {
  it("lista todos os achados com badge textual e file:line", () => {
    const w = setup();
    const items = w.findAll("[data-testid=finding]");
    expect(items).toHaveLength(findings.length);
    expect(items[0]?.text()).toContain("Crítica");
    expect(items[0]?.text()).toContain("src/auth/guard.ts:27");
  });

  it("filtro de categoria reduz a lista e marca aria-pressed", async () => {
    const w = setup();
    const chip = w.get("[data-testid=filter-category-INSECURE_CODE]");
    await chip.trigger("click");
    expect(chip.attributes("aria-pressed")).toBe("true");
    const items = w.findAll("[data-testid=finding]");
    expect(items).toHaveLength(3);
  });

  it("filtro de severidade combina com categoria", async () => {
    const w = setup();
    await w.get("[data-testid=filter-category-SECRET]").trigger("click");
    await w.get("[data-testid=filter-severity-HIGH]").trigger("click");
    const items = w.findAll("[data-testid=finding]");
    expect(items).toHaveLength(1);
    expect(items[0]?.text()).toContain("src/config.ts:12");
  });

  it("filtro sem resultado mostra mensagem", async () => {
    const w = setup();
    await w.get("[data-testid=filter-category-HIDDEN_UNICODE]").trigger("click");
    await w.get("[data-testid=filter-severity-LOW]").trigger("click");
    expect(w.findAll("[data-testid=finding]")).toHaveLength(0);
    expect(w.text()).toContain("Nenhum achado com esses filtros");
  });

  it("copiar prompt chama a clipboard e anuncia 'Copiado' em aria-live", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const w = setup();
    await w.findAll("[data-testid=copy-prompt]")[1]!.trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith(findings[1]!.fix_prompt);
    const live = w.get("[data-testid=copy-status]");
    expect(live.attributes("aria-live")).toBe("polite");
    expect(live.text()).toContain("Copiado");
  });

  it("lista vazia mostra estado positivo", () => {
    const w = mount(FindingsCard, {
      props: {
        findings: [],
        summary: {
          by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          by_category: { SECRET: 0, HIDDEN_UNICODE: 0, SLOPSQUATTING: 0, INSECURE_CODE: 0 },
        },
      },
    });
    expect(w.text()).toContain("Nenhum problema encontrado");
  });

  it("contadores dos chips vêm do summary (totais reais) e truncated mostra aviso com N", () => {
    const big: ScanSummary = {
      by_severity: { CRITICAL: 40, HIGH: 300, MEDIUM: 400, LOW: 60 },
      by_category: { SECRET: 120, HIDDEN_UNICODE: 80, SLOPSQUATTING: 0, INSECURE_CODE: 600 },
    };
    const five = Array.from({ length: 500 }, (_, i) => ({ ...findings[i % findings.length]!, id: `t-${i}` }));
    const w = mount(FindingsCard, { props: { findings: five, summary: big, truncated: true } });
    expect(w.get("[data-testid=filter-category-INSECURE_CODE]").text()).toContain("600");
    expect(w.get("[data-testid=filter-severity-HIGH]").text()).toContain("300");
    expect(w.get("[data-testid=truncated-notice]").text()).toContain("Mostrando os 500 achados mais graves de 800");
  });

  it("sem truncated não mostra o aviso", () => {
    const w = setup();
    expect(w.find("[data-testid=truncated-notice]").exists()).toBe(false);
  });
});
