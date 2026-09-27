# AI Context — IC Portal (IIM Rohtak Internship Committee)

Read this file fully before making any change. It exists because multiple
people (and multiple AI assistants) work on this codebase at different
times, often without seeing each other's sessions. This file is the shared
memory across all of them. If you change something that future collaborators
would need to know, **update this file in the same commit.**

For full technical detail (spreadsheet schemas, Sheet setup steps, gallery
rebuild instructions), see `../README.md` — this file is the fast-orientation
layer, README.md is the reference layer. Don't duplicate README content here;
link to it.

---

## 1. What this project is

A static website for the Internship Committee (IC) of IIM Rohtak — a
student resource/opportunity portal for IPM students. Sections: Home,
Knowledge Repository (Course Repository, Case Studies, GitHub Repositories,
IIMR Student Resources), Case Competitions, Live Projects.

Owner/primary contact: Avi, involved with the IC's Internship Committee.
Repo: `github.com/Internship-Committee/IC-Portal` (deployed via GitHub
Pages, updated through GitHub Desktop).

## 2. Hard constraints — do not violate these

- **No frameworks, no backend, no build step** for the site itself. Plain
  HTML5 / CSS3 / vanilla JS only, deployable as-is on GitHub Pages. The
  **one exception** is `/gallery` (React/TS/Tailwind source for the
  homepage's 3D circular gallery) — it ships **pre-built** as
  `assets/circular-gallery.js` / `.css`. You only touch `/gallery` and
  rebuild (`cd gallery && npm install && npm run build`) if asked to change
  the homepage gallery cards specifically. Never introduce a build step
  anywhere else.
- **Nothing is hard-coded content.** Courses, case studies, repos,
  resources, competitions, and live projects are all rendered from JSON
  (currently `/data/*.json` demo files, designed to be swapped for a live
  Google Sheet via `js/config.js` — see README.md §2–3). Don't hand-write
  cards directly into HTML.
- **All paths are relative** (`css/base.css`, not `/css/base.css`) — the
  site must work whether it's served from the domain root or a GitHub
  Pages project path.
- **`js/config.js` is the one file meant to be edited for going live**
  (Sheet ID, tab names, contact links, per-source local/live toggles).
  Don't scatter config values into other files.

## 3. Protected: the Firebase access gate — read before touching Live Projects pages

`live-project.html` and `live-projects.html` are gated behind Google
Sign-In, restricted to `@iimrohtak.ac.in` accounts. This is **live in
production** with a real Firebase project already wired in. The following
must be preserved on every edit to those two pages:

- `<link rel="stylesheet" href="css/access-gate.css">` in `<head>`
- the `<div id="ic-gate">...</div>` block right after `<body>`
- the two Firebase `<script>` tags (`firebase-app-compat.js`,
  `firebase-auth-compat.js`) and `<script src="js/access-gate.js">`,
  loaded last, in that order

**Never regenerate `live-project.html` or `live-projects.html` from
scratch** without carrying this block over — if you redesign these pages,
edit around the gate, don't drop it and rebuild the page fresh.

`js/access-gate.js` contains a **real Firebase project config**
(`apiKey`, `authDomain`, `projectId`). This is expected to be visible
client-side — it is not a secret, and the actual access control comes from
Firebase's "Authorized domains" setting plus the `hd`/email-domain check in
that file, not from hiding the config. Do not strip or placeholder-ize
these values if they're already filled in — that would break the live gate.
No other page loads `access-gate.js` or `access-gate.css` — don't add them
elsewhere without being asked.

The Firebase project currently backing this (`test-adi-43d9b`) was set up
by a contributor on what looks like a personal/test account, not an
IC-owned one — flag this to Avi if it comes up, it may move to an IC-owned
Firebase project later.

## 4. Design system (current)

Theme: deep burgundy / near-black background with cream and rose accents
(editorial, bold). Defined as CSS custom properties in `css/base.css` —
**always use the existing tokens, never hard-code a color/radius/font.**

```
--bg: #0c0507        --accent: #A23347 (rose-red, primary CTA)
--surface: rgba(58,20,27,0.38)     --accent-2: #D9A86C (warm gold)
--text-primary: #F4E9DC (warm cream)      --text-secondary: #C9B4A8
--radius-s/m/l: 8px / 12px / 16px
--font-display: Fraunces (serif, headings/wordmark)
--font-heavy: Archivo (bold display type)
--font-body: Manrope (body/UI)
```

This has changed direction more than once (started cobalt-blue/light,
moved through maroon/black, now burgundy/cream/rose) — always check
`css/base.css` directly for the current values rather than trusting a
prior description, including this one, if there's any doubt.

The homepage has a scroll-driven 3D circular gallery (see README.md §8)
— six cards for the six sections, orbiting a central revolving IC logo,
built from `/gallery` React source into `assets/circular-gallery.js/.css`.
It degrades to a plain stacked list with JS disabled or reduced-motion.

## 5. Working conventions for this repo

- **Multiple people and AI assistants edit this independently** — assume
  you don't have the full history. Before a substantial rewrite of any
  page, check what's currently in the file rather than regenerating from
  memory of an earlier version.
- Prefer editing existing files over replacing them wholesale, especially
  for `live-project.html` / `live-projects.html` (§3) and anything reading
  from `js/config.js`.
- Deployment is manual via GitHub Desktop (commit + push); GitHub Pages
  rebuilds automatically in ~1 minute. There is no CI/CD, no separate
  staging environment.
- If you change something structural (new page, new data field, new
  protected block, changed design direction), **add a short dated note to
  §6 below** so the next collaborator isn't surprised.

## 6. Change log (add newest entries at the top)

- 2026-09: Firebase Google Sign-In gate added to Live Projects pages
  (`js/access-gate.js`, `css/access-gate.css`), real config live in
  production. See §3.
