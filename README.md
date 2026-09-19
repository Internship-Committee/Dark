# Internship Committee Portal — IIM Rohtak

A static, GitHub Pages–ready website for the Internship Committee (IC) of IIM
Rohtak. Built with plain HTML, CSS and JavaScript — no framework, no build
step, no server required to run it.

---

## 1. Project structure

```
/project
  index.html                 Home (3D logo signature + primary nav cards)
  knowledge-repository.html  Knowledge Repository landing (4 sub-tiles)
  courses.html                Course Repository
  case-studies.html           Case Studies
  github-repositories.html    GitHub Repositories
  iimr-resources.html         IIMR Student Resources
  case-competitions.html      Case Competitions
  live-projects.html          Live Projects (listing)
  live-project.html           Live Project detail (?id=... — one page, all projects)
  README.md

  /css
    base.css        tokens, typography, resets, accessibility
    layout.css       sidebar, topbar, mobile drawer, grids
    components.css   cards, buttons, badges, chips
    home.css          hero + the 3D revolving-logo signature
    lp-detail.css      Live Project detail page layout

  /js
    config.js                    ← the ONE file you edit to go live
    data-adapter.js               fetch + normalize layer (Sheets-ready)
    icons.js                      small inline SVG set + shared helpers
    sidebar.js                     mobile drawer, dropdown, active link
    render-courses.js
    render-case-studies.js
    render-github.js
    render-resources.js
    render-competitions.js
    render-live-projects.js
    render-live-project-detail.js

  /data                          bundled DEMO data (used until Sheets are wired up)
    courses.json
    case-studies.json
    github-repos.json
    resources.json
    competitions.json
    live-projects.json

  /assets
    logo.png                     IC IIM Rohtak logo (1600×1600)
```

### About the logo file

`assets/logo.png` currently holds the IC IIM Rohtak crest logo. To swap in
a higher-resolution version, replace that file (same filename, ideally a
transparent-background PNG or SVG). Nothing else needs to change — the
sidebar, browser tab icon, and the homepage's 3D revolving logo all read
from that one file automatically. If you'd rather it were an `.svg`,
update the single `logo:` line in `js/config.js` to point at it.

The homepage renders the logo in white via CSS (`filter: brightness(0)
invert(1)`), so a logo with any original colour will still show up crisp
white against the dark background — no need to pre-process it.

---

## 2. Data architecture — how content flows

```
Google Sheet  →  Apps Script Web App (JSON)  →  js/config.js (one URL)
      →  js/data-adapter.js (fetch + normalize)  →  render-*.js  →  cards
```

**Nothing is hard-coded into the HTML.** Every card you see (courses, case
studies, repos, resources, competitions, live projects) is generated in
JavaScript from a JSON array — right now that array comes from the small
demo files in `/data`, and later it will come from your Google Sheets
instead. The HTML and CSS never change either way.

### Spreadsheet schemas

Use these exact column headers (order doesn't matter, matching is
case-insensitive) in each Google Sheet tab:

**Courses**
```
Course Name | Domain | Price | Rating | Course Link
```
`Domain` should be one of: Finance, Marketing, Consulting, Entrepreneurship,
Leadership, Data Analytics, Business Analytics, Operations Management (or a
new one you add later) — the filter pills on the Course Repository page are
generated from whatever values appear in the sheet, so a new domain needs no
code change. The "All" pill is always added automatically.

**Case Studies**
```
Case Study Name | Author | Link
```

**GitHub Repositories**
```
Repository Name | Description | Link
```

**IIMR Resources**
```
Resource Name | Description | College Login Required | Link
```
`College Login Required` should contain `Yes` or `No`.

**Case Competitions**
```
Competition Name | Institute | Deadline | Link
```
`Deadline` can be any parseable date (e.g. `2026-10-12` or `12 Oct 2026`) —
the page sorts and formats it automatically.

**Live Projects**
```
ID | Company | Status | Tagline | About the Company | Job Description |
Role 1 | Role 1 Responsibilities | Role 1 Takeaways |
Role 2 | Role 2 Responsibilities | Role 2 Takeaways |
Selection Criteria | Location | Project Duration |
Apply URL | Deadline | Policy Note | Google Doc URL
```
- `ID` should be a short unique slug per row (e.g. `acme-2026-outreach`) —
  it's what the detail page URL uses (`live-project.html?id=acme-2026-outreach`).
  If you leave it blank, one is generated automatically from the company name.
- `Role 1 Responsibilities` / `Selection Criteria`: put one point per line
  inside the cell (press <kbd>Alt/⌥</kbd>+<kbd>Enter</kbd> in Sheets for a
  line break within a cell) — the page turns each line into a bullet.
- `Status`: set to `Closed` to hide a project from the listing without
  deleting the row.
- See "Google Docs → Live Project pages" below for why most of these
  columns exist even though the source document already has this
  information.

---

## 3. Connecting the Google Sheet (step-by-step)

The site is already wired to one Google Sheet — the ID is set in
`js/config.js` (`IC_CONFIG.sheetId`). It reads each tab of that sheet as
CSV directly in the browser, using a Google-provided export endpoint. No
Apps Script, no deployment, no separate "Publish to web" link to generate
per tab.

1. **Share the sheet.** Open the sheet → **Share** (top right) → under
   "General access" choose **Anyone with the link**, role **Viewer**.
   This is required — without it, the site can't read the tabs at all.
2. **Rename the six tabs** at the bottom of the sheet to exactly:
   `Courses`, `Case Studies`, `GitHub Repositories`, `IIMR Resources`,
   `Case Competitions`, `Live Projects` (matching `IC_CONFIG.sheetTabs` in
   `js/config.js` — spelling and spacing must match exactly).
3. **Set up the column headers** in each tab per "Spreadsheet schemas"
   above.
4. In `js/config.js`, flip that tab's flag to `false`, e.g.:
   ```javascript
   useLocalData: {
     courses: false,   // now reads live from the "Courses" tab
     caseStudies: true, // still on demo data until its tab is ready
     ...
   }
   ```
5. Repeat per tab — mix and match freely, e.g. keep Competitions on demo
   data while Courses is already live.

From then on, **the committee only ever edits the Google Sheet.** No code
changes, no redeploy needed — the website reads each tab fresh on every
page load.

**If you'd rather use a different sheet, or a real backend later:** paste
a full URL (returning JSON) into the matching line under `endpoints` in
`js/config.js` — that always takes priority over the shared sheet for that
one data source, no other file needs to change.

---

## 4. Google Docs → Live Project pages

The Live Project workflow is intentionally **not** "embed the Google Doc."
A Doc is authenticated, unstyled, and not something a browser can reliably
fetch and re-render either — so the correct approach is to keep the Google
Doc as the committee's authoring surface, and let the **Live Projects
sheet** be the structured, machine-readable version of that same
information.

**Recommended day-to-day flow:**
1. The IC writes/edits the Live Project communication as it always has,
   in a Google Doc.
2. When it's ready to publish, someone on the committee copies the
   relevant fields into one row of the Live Projects sheet (Company, About,
   Job Description, Role(s), Selection Criteria, Location, Duration, Apply
   URL, Deadline, Policy Note) — the `Google Doc URL` column just keeps a
   reference back to the source document for the committee's own records.
   This takes a couple of minutes per project and is far more reliable
   than trying to auto-parse a Doc's formatting in the browser.
3. The website renders that row into a polished, native page automatically
   — no HTML is written by hand.

**If you later want to remove that manual copy step:** the architecture
already supports adding a small backend (e.g. a Cloud Function or Apps
Script bound to the Doc) that watches the Doc, extracts the same fields,
and writes them into the Sheet automatically. Because the frontend only
ever talks to the Sheet-backed endpoint, that upgrade would require zero
frontend changes.

---

## 5. Deploying to GitHub Pages

1. **Create the repository.** On github.com, click **New repository**,
   give it a name (e.g. `ic-portal`), and create it (public, so Pages can
   serve it for free).
2. **Upload the project.** Easiest path if you're new to Git:
   - On the repository page, click **Add file → Upload files**.
   - Drag in every file and folder from this project (keep the folder
     structure — `css/`, `js/`, `data/`, `assets/` should stay as folders).
   - Commit the upload.
3. **Enable GitHub Pages.**
   - Go to the repository's **Settings → Pages**.
   - Under **Build and deployment → Source**, choose **Deploy from a
     branch**.
   - Under **Branch**, choose `main` and folder `/ (root)`, then **Save**.
4. **Open the deployed site.** After a minute or two, the same Pages
   settings screen will show a live URL, typically:
   `https://<your-username>.github.io/<repo-name>/`
5. **Updating the website later.** Edit a file locally (or directly on
   GitHub via the pencil icon), commit the change — GitHub Pages
   automatically rebuilds and republishes within about a minute. There's no
   separate deploy step.
6. **Custom domain (optional, later).** In the same **Settings → Pages**
   screen, enter your domain under **Custom domain**, and add the DNS
   records GitHub shows you at your domain registrar. GitHub issues a free
   HTTPS certificate for it automatically.

Everything in this project uses **relative paths** (`css/base.css`, not
`/css/base.css`), so it works correctly whether the site lives at the root
of a domain or under a GitHub Pages project path like
`/ic-portal/`.

---

## 6. Future extensibility

The current MVP is deliberately just a static frontend + Apps Script data
layer. It can grow without a rebuild:

- **Real backend / database:** `js/data-adapter.js` is the only place that
  knows how data is fetched. Swapping Apps Script URLs for real API
  endpoints (e.g. a small Node/Express or serverless API backed by a
  database) means editing that one file — every page keeps working
  unchanged.
- **Authentication / private access:** could be added as a lightweight
  gate (e.g. Google OAuth restricted to `@iimrohtak.ac.in` accounts) in
  front of the existing pages, without touching the rendering logic.
- **Admin dashboard:** since all content already lives in Sheets, a simple
  admin view could just be a nicer Sheet-editing UI (or a small internal
  form that writes to the Sheet via the same Apps Script pattern).
- **Automated scraper pipeline:** the scraper you already have can keep
  writing straight into the same Sheets — the website will pick up new
  rows on the next page load with no changes needed.
- **Richer Live Project management:** more fields can be added to the
  Live Projects sheet at any time; `normLiveProject()` in
  `data-adapter.js` is where you'd map any new column into the page.

---

## 7. What's intentionally NOT included (MVP scope)

Per the brief, this MVP does not include search/filtering (beyond the
simple domain pills on the Course Repository), user accounts,
authentication, analytics dashboards, or a backend — all of that is listed
above as a future step, not missing functionality.
