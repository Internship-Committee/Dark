/* ============================================================
   IC Portal — Central configuration
   ------------------------------------------------------------
   This is the ONLY file you should need to edit when connecting
   the real Google Sheet. Every page reads its data source from here.

   HOW THE GOOGLE SHEET CONNECTION WORKS
   ------------------------------------------------------------
   The site reads each tab of the sheet below as CSV, directly —
   no Apps Script, no "Publish to web" step, no per-tab links to
   generate. It only needs two things to be true:

   1. The sheet is shared as "Anyone with the link → Viewer"
      (Share button, top right of the Google Sheet).
   2. The tab names in the sheet exactly match `sheetTabs` below,
      and the column headers match README.md's "Spreadsheet
      schemas" section.

   Once both are true, flip the matching `useLocalData` flag to
   `false` and that page reads live from the sheet on every load.
   That's it — no other file needs to change.
   ============================================================ */

const IC_CONFIG = {

  // Committee contact links — replace placeholders with real values.
  // Until real links are supplied, these stay as clearly marked placeholders.
  committee: {
    email: "internshipcommittee@iimrohtak.ac.in", // TODO: confirm official IC email
    emailIsPlaceholder: true,
    linkedin: "https://www.linkedin.com/company/ipm-internship-committee-iim-rohtak/",
    linkedinIsPlaceholder: false
  },

  // Logo asset used across the site (sidebar + homepage 3D signature).
  logo: "assets/logo.png",

  // The single Google Sheet the whole site reads from. This is the ID
  // from the sheet's URL: .../spreadsheets/d/<THIS PART>/edit
  sheetId: "1gW0akOSLXywyDPu3WOQ_21WYBTiZTrgUT1PdX3Iw_qw",

  // Tab (sheet) names inside that spreadsheet, one per data source.
  // Rename tabs in the sheet to match these exactly (case/spacing
  // sensitive) — see README.md for the columns each tab needs.
  sheetTabs: {
    courses:      "Courses",
    caseStudies:  "Case Studies",
    githubRepos:  "GitHub Repositories",
    resources:    "IIMR Resources",
    competitions: "Case Competitions",
    liveProjects: "Live Projects"
  },

  // While true, the data-adapter reads bundled local JSON files in /data
  // (works with zero setup, perfect for previewing before the sheet is ready).
  // Flip to false per-source once that source's tab is set up correctly.
  useLocalData: {
    courses: true,
    caseStudies: true,
    githubRepos: true,
    resources: true,
    competitions: false,
    liveProjects: false
  },

  // Local fallback / demo data (bundled with the site, edited by hand
  // only until the real Google Sheet tab above is wired up).
  localPaths: {
    courses:        "data/courses.json",
    caseStudies:    "data/case-studies.json",
    githubRepos:    "data/github-repos.json",
    resources:      "data/resources.json",
    competitions:   "data/competitions.json",
    liveProjects:   "data/live-projects.json"
  },

  // Optional escape hatch: if you ever want a data source to come from
  // somewhere other than the sheet above (e.g. a different sheet, or an
  // Apps Script endpoint returning JSON), paste a full URL here and it
  // takes priority over `sheetTabs` for that source. Leave blank to use
  // the shared sheet above.
  endpoints: {
    courses:        "",
    caseStudies:    "",
    githubRepos:    "",
    resources:      "",
    competitions:   "",
    liveProjects:   ""
  }
};
