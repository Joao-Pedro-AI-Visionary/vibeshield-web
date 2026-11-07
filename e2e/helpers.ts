import type { Page } from "@playwright/test";
import sample from "./fixtures/scan.json" with { type: "json" };

export const API = "http://api.test/api/v1";
export const SAMPLE = sample;

export async function mockScanOk(page: Page) {
  const bodies: unknown[] = [];
  await page.route(`${API}/scans`, async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sample) });
  });
  return bodies;
}

export async function mockScanError(page: Page, status: number, code: string) {
  await page.route(`${API}/scans`, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: { code, message: "texto do servidor" } }),
    }),
  );
}
