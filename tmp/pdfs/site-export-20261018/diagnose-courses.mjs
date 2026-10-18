import { chromium } from "file:///C:/Users/Avanish%20Singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("console", message => { if (message.type() === "error") console.log("CONSOLE", message.text()); });
page.on("pageerror", error => console.log("PAGEERROR", error.message));
page.on("requestfailed", request => console.log("FAILED", request.url(), request.failure()?.errorText));
page.on("response", response => { if (response.url().includes("docs.google.com")) console.log("SHEETS", response.status(), response.url()); });
await page.goto("http://127.0.0.1:8765/courses.html", { waitUntil: "load" });
await page.waitForTimeout(15000);
console.log("URL", page.url());
console.log("PATHS", await page.locator("#course-paths").innerText().catch(() => "missing"));
console.log("CARDS", await page.locator(".course-domain-card").count());
await browser.close();
