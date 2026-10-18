import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "file:///C:/Users/Avanish%20Singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const baseUrl = "http://127.0.0.1:8765";
const root = resolve("tmp/pdfs/site-export-20261018");
const output = join(root, "sections");
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--no-sandbox"]
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce"
});
context.setDefaultTimeout(60000);
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await mkdir(output, { recursive: true });

const printCss = `
@page { size: A3 landscape; margin: 10mm; }
@media print {
  html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; }
  body { background: #F5F1E8 !important; color: #142B48 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .app-shell { display: block !important; min-height: 0 !important; height: auto !important; overflow: visible !important; }
  .sidebar { position: relative !important; inset: auto !important; z-index: 1 !important; width: 100% !important; height: auto !important; min-height: 0 !important; overflow: visible !important; break-inside: avoid !important; }
  .mobile-topbar, .sidebar-scrim, .skip-link, .sidebar-pin-btn, .menu-btn, .competition-day-dialog { display: none !important; }
  .main { position: relative !important; inset: auto !important; width: 100% !important; min-height: 0 !important; height: auto !important; overflow: visible !important; padding-bottom: 12mm !important; }
  .calendar-scroll-area, .top-picks-list, .competition-calendar-layout, .competition-day-events { max-height: none !important; height: auto !important; overflow: visible !important; }
  .site-footer { break-inside: avoid !important; }
  .card-grid, .course-domain-list, .calendar-grid, .agenda-items { break-inside: auto !important; }
  .glass-card, .course-card, .deadline-item, .list-card { break-inside: avoid !important; }
  a { text-decoration: none !important; }
  body[data-page="courses"] .course-domain-gallery { height: 178mm !important; }
  body[data-page="home"] .home-intro { display: none !important; animation: none !important; }
  body[data-page="home"] .home-index { padding: 10mm 10mm 7mm !important; }
  body[data-page="home"] .home-index-heading { margin-bottom: 7mm !important; column-gap: 10mm !important; }
  body[data-page="home"] .home-index-heading::before { width: 78mm !important; opacity: .05 !important; }
  body[data-page="home"] .home-kicker { margin-bottom: 3mm !important; }
  body[data-page="home"] .home-index-heading h2 { font-size: 48pt !important; }
  body[data-page="home"] .home-values { margin-top: 3mm !important; }
  body[data-page="home"] .home-index-row { min-height: 18mm !important; }
  body[data-page="home"] footer.site-footer { margin-top: 8mm !important; padding-top: 4mm !important; }
  body[data-page="courses"] .course-domain-card { transition: none !important; }
  body[data-page="courses"].pdf-domain-export #main-content { display: none !important; }
  body[data-page="courses"] #course-domain-view[hidden] { display: block !important; }
  body[data-page="courses"] #course-domain-view { position: relative !important; inset: auto !important; z-index: auto !important; width: 100% !important; height: auto !important; max-height: none !important; overflow: visible !important; }
  body[data-page="courses"] #course-domain-view .course-domain-view__cover { min-height: 168mm !important; break-inside: avoid !important; }
  body[data-page="courses"] #course-domain-view .course-domain-view__content { padding-bottom: 20mm !important; }
  body[data-page="courses"] #course-domain-view .course-domain-list { overflow: visible !important; }
  body.course-domain-open { overflow: visible !important; }
  body[data-page="live-projects"] #ic-gate,
  body[data-page="live-project"] #ic-gate { position: relative !important; inset: auto !important; z-index: auto !important; display: grid !important; min-height: 250mm !important; height: auto !important; place-items: center !important; background: #F5F1E8 !important; }
  body[data-page="live-projects"] .app-shell,
  body[data-page="live-project"] .app-shell { display: none !important; }
  body[data-page="live-projects"] .ic-gate-card,
  body[data-page="live-project"] .ic-gate-card { break-inside: avoid !important; }
}
`;

async function settle(page) {
  await page.evaluate(() => document.fonts?.ready || Promise.resolve());
  await page.waitForTimeout(850);
}

async function printRoute(filename, title, file, ready) {
  await page.goto(`${baseUrl}/${filename}`, { waitUntil: "load", timeout: 60000 });
  if (ready) await ready();
  await settle(page);
  await page.addStyleTag({ content: printCss });
  await page.pdf({
    path: join(output, file),
    format: "A3",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
  });
  console.log(`Rendered ${title}`);
}

const waitFor = async expression => page.waitForFunction(expression, null, { timeout: 60000 });

await printRoute("index.html", "Home", "01-home.pdf", async () => {
  await page.waitForFunction(() => document.readyState === "complete", null, { timeout: 30000 });
});

await page.goto(`${baseUrl}/courses.html`, { waitUntil: "load" });
let domainCards = 0;
for (let attempt = 0; attempt < 3 && !domainCards; attempt += 1) {
  try {
    await page.waitForFunction(() => document.querySelectorAll("#course-paths .course-domain-card").length > 0, null, { timeout: 20000 });
    domainCards = await page.locator("#course-paths .course-domain-card").count();
  } catch (error) {
    if (attempt === 2) throw new Error(`Course data did not load after three tries: ${error.message}`);
    await page.reload({ waitUntil: "load" });
  }
}
await settle(page);
const domains = await page.locator(".course-domain-card").evaluateAll(cards => cards.map(card => ({
  name: card.dataset.domain,
  count: Number((card.getAttribute("aria-label") || "").match(/(\d+) courses?$/)?.[1] || 0)
})));
await page.addStyleTag({ content: printCss });
await page.pdf({
  path: join(output, "02-course-gallery.pdf"),
  format: "A3",
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
});
console.log(`Rendered Course Repository landing page (${domains.length} panels)`);

for (let index = 0; index < domains.length; index += 1) {
  const domain = domains[index];
  await page.locator(".course-domain-card").nth(index).evaluate(button => button.click());
  await page.waitForFunction(name => document.querySelector("#course-domain-title")?.textContent?.trim() === name, domain.name, { timeout: 30000 });
  await settle(page);
  const safe = domain.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await page.evaluate(() => document.body.classList.add("pdf-domain-export"));
  await page.pdf({
    path: join(output, `course-${String(index + 1).padStart(2, "0")}-${safe}.pdf`),
    format: "A3",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
  });
  await page.evaluate(() => document.body.classList.remove("pdf-domain-export"));
  console.log(`Rendered expanded course domain: ${domain.name} (${domain.count} courses)`);
  await page.locator("[data-close-domain]").evaluate(button => button.click());
  await page.waitForFunction(() => !document.body.classList.contains("course-domain-open"), null, { timeout: 30000 });
}

await printRoute("iimr-resources.html", "IIMR Student Resources", "12-resources.pdf", async () => {
  await waitFor(() => document.querySelectorAll("#resources-grid > *").length > 0);
});
await printRoute("case-competitions.html", "Case Competitions", "13-case-competitions.pdf", async () => {
  await waitFor(() => {
    const text = document.querySelector("#competition-filter-status")?.textContent || "";
    return text && !text.toLowerCase().includes("loading") && document.querySelectorAll("#calendar-grid .calendar-day").length > 0;
  });
});
await printRoute("live-projects.html", "Live Projects (members only)", "14-live-projects-gate.pdf", async () => {
  await waitFor(() => document.querySelector("#ic-gate h2")?.textContent?.includes("Members Only"));
});
await printRoute("live-project.html", "Live Project detail (members only)", "15-live-project-detail-gate.pdf", async () => {
  await waitFor(() => document.querySelector("#ic-gate h2")?.textContent?.includes("Members Only"));
});

await writeFile(join(root, "manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  domains,
  pageErrors: errors,
  sections: [
    { title: "Home", file: "01-home.pdf" },
    { title: "Course Repository", file: "02-course-gallery.pdf" },
    ...domains.map((domain, index) => ({
      title: `${domain.name} — ${domain.count} courses`,
      file: `course-${String(index + 1).padStart(2, "0")}-${domain.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`
    })),
    { title: "IIMR Student Resources", file: "12-resources.pdf" },
    { title: "Case Competitions", file: "13-case-competitions.pdf" },
    { title: "Live Projects — members only", file: "14-live-projects-gate.pdf" },
    { title: "Live Project detail — members only", file: "15-live-project-detail-gate.pdf" }
  ]
}, null, 2));
await browser.close();
if (errors.length) console.error("Browser page errors:", errors);
