// Capture docs/hero.png from a running app.
// Usage: node scripts/hero.mjs [url]
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://127.0.0.1:8788/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("#preview svg");
await page.waitForTimeout(600);
await page.screenshot({ path: "docs/hero.png" });
await browser.close();
console.log("wrote docs/hero.png");
