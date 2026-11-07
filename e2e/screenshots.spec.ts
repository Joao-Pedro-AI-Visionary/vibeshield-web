import { expect, test } from "@playwright/test";
import { SAMPLE, mockScanOk } from "./helpers";

const SIZES = [
  { name: "desktop-1440", width: 1440, height: 1000, fullPage: true },
  { name: "mobile-375", width: 375, height: 812, fullPage: true },
] as const;

for (const size of SIZES) {
  test(`screenshot ${size.name} com resultado mockado`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockScanOk(page);
    await page.goto("/");
    await page.getByLabel("URL do repositório GitHub").fill(SAMPLE.repo.url);
    await page.getByTestId("scan-button").click();
    await expect(page.getByTestId("score")).toHaveText(String(SAMPLE.score));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${size.name}.png`, fullPage: size.fullPage });
  });
}
