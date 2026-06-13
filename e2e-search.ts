import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto("http://localhost:5173");
await page.waitForSelector(".folder-row");

// Search for "2026" -> deeply nested, should auto-expand ancestors
await page.locator(".search-input").fill("2026");
await page.waitForTimeout(200);

const visible = await page.locator(".folder-row .name").allTextContents();
console.log("Visible nodes for '2026':", visible);

// Search for something matching nothing
await page.locator(".search-input").fill("zzz-nope");
await page.waitForTimeout(200);
const noResults = await page.locator(".no-results").textContent();
console.log("No results message:", noResults);

// Search for "Work" -> should show Work + ancestors (Documents) + descendant Reports/2026
await page.locator(".search-input").fill("Work");
await page.waitForTimeout(200);
const workVisible = await page.locator(".folder-row .name").allTextContents();
console.log("Visible nodes for 'Work':", workVisible);

// Clear search -> back to normal (collapsed except previously expanded)
await page.locator(".search-input").fill("");
await page.waitForTimeout(200);
const cleared = await page.locator(".folder-row .name").allTextContents();
console.log("Visible nodes after clear:", cleared);

await page.screenshot({ path: "/tmp/search-screenshot.png", fullPage: true });
await browser.close();
console.log("Done.");
