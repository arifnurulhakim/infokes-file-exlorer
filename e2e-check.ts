import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

page.on("console", (msg) => console.log("[console]", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto("http://localhost:5173");
await page.waitForSelector(".folder-row");

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

await browser.close();
console.log("Done.");
