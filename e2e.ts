import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

page.on("console", (msg) => console.log("[console]", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto("http://localhost:5173");
await page.waitForSelector(".folder-row");

// --- Browse tree & contents ---

// Left panel: full tree should show root folders
const rootFolders = await page.locator(".folder-tree > .folder-node > .folder-row .name").allTextContents();
console.log("Root folders:", rootFolders);

// Click "Documents" -> right panel should show Personal + Work
await page.locator(".folder-row .name", { hasText: "Documents" }).click();
await page.waitForTimeout(300);
let rightItems = await page.locator(".right-panel .item").allTextContents();
console.log("Documents children:", rightItems);

// Documents already auto-expanded (selected) -> click "Work" -> right panel should show Reports
await page.locator(".folder-row .name", { hasText: "Work" }).click();
await page.waitForTimeout(300);
rightItems = await page.locator(".right-panel .item").allTextContents();
console.log("Work children:", rightItems);

// Click "Personal" (has file resume.pdf)
await page.locator(".folder-row .name", { hasText: "Personal" }).click();
await page.waitForTimeout(300);
rightItems = await page.locator(".right-panel .item").allTextContents();
console.log("Personal children (should include file):", rightItems);

// Click "Pictures" -> auto-expands -> "Vacation" should become visible
await page.locator(".folder-row .name", { hasText: "Pictures" }).click();
await page.waitForTimeout(200);
const vacationVisible = await page.locator(".folder-row .name", { hasText: "Vacation" }).first().isVisible();
console.log("Vacation visible after expanding Pictures:", vacationVisible);

await page.screenshot({ path: "/tmp/explorer-screenshot.png", fullPage: true });

// --- Search ---

// Search for "2026" -> deeply nested, should auto-expand ancestors
await page.locator(".search-input").fill("2026");
await page.waitForTimeout(200);
const visible = await page.locator(".folder-row .name").allTextContents();
console.log("Visible nodes for '2026':", visible);

// Search for something matching nothing
await page.locator(".search-input").fill("zzz-nope");
await page.waitForTimeout(400);
const noResults = await page.locator(".no-results").allTextContents();
console.log("No results messages:", noResults);

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
