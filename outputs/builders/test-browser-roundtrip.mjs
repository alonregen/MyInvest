import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const demoPath = path.join(root, "assets/savings-dashboard-demo.xlsx");
const expectedBytes = fs.readFileSync(demoPath);
const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:8765/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(baseUrl, { waitUntil: "networkidle" });

const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "הורדת תבנית XLSX" }).click();
const download = await downloadPromise;
const downloadPath = await download.path();
const downloadedBytes = fs.readFileSync(downloadPath);

if (!downloadedBytes.equals(expectedBytes)) {
  throw new Error(`download mismatch: ${downloadedBytes.length} vs ${expectedBytes.length} bytes`);
}

await page.locator("#file-input").setInputFiles(demoPath);
await page.waitForFunction(
  () => {
    const total = document.getElementById("kpi-total")?.textContent ?? "";
    const holdings = document.getElementById("kpi-holdings")?.textContent ?? "";
    return total.includes("1,089,500") && holdings === "12";
  },
  { timeout: 15000 }
);

const errorBanner = await page.locator("#error-banner").textContent();
if (errorBanner?.trim()) {
  throw new Error(`dashboard error banner: ${errorBanner}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      downloadFile: download.suggestedFilename(),
      kpiTotal: await page.locator("#kpi-total").textContent(),
      kpiHoldings: await page.locator("#kpi-holdings").textContent(),
      fileNameLabel: await page.locator("#file-name").textContent(),
    },
    null,
    2
  )
);

await browser.close();
