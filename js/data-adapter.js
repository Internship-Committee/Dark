/* ============================================================
   IC Portal — Data adapter layer
   ------------------------------------------------------------
   Single place responsible for FETCHING + NORMALIZING data.
   Rendering code never talks to a URL directly — it always
   calls one of the functions below, so the source (local JSON
   today, a Google Sheet endpoint tomorrow) can change without
   touching any page's rendering logic.
   ============================================================ */

const ICData = (() => {

  async function fetchSource(key){
    const useLocal = IC_CONFIG.useLocalData[key];

    // 1. Local demo JSON (default until the sheet is wired up).
    if (useLocal){
      const url = IC_CONFIG.localPaths[key];
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not load "${key}" data (HTTP ${res.status}).`);
      return res.json();
    }

    // 2. Explicit override endpoint (e.g. Apps Script URL returning JSON),
    //    if one was pasted into IC_CONFIG.endpoints.
    const overrideUrl = IC_CONFIG.endpoints && IC_CONFIG.endpoints[key];
    if (overrideUrl){
      const res = await fetch(overrideUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not load "${key}" data (HTTP ${res.status}).`);
      return res.json();
    }

    // 3. Default: read the matching tab of the shared Google Sheet as CSV.
    const sheetId = IC_CONFIG.sheetId;
    const tabName = IC_CONFIG.sheetTabs && IC_CONFIG.sheetTabs[key];
    if (!sheetId || !tabName){
      throw new Error(
        `No data source configured for "${key}". Set IC_CONFIG.sheetId and ` +
        `IC_CONFIG.sheetTabs.${key} in js/config.js, or keep useLocalData.${key} = true ` +
        `to use the bundled demo data.`
      );
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok){
      throw new Error(
        `Could not load "${key}" data from the "${tabName}" tab (HTTP ${res.status}). ` +
        `Make sure the sheet is shared as "Anyone with the link – Viewer" and the tab ` +
        `name matches exactly.`
      );
    }
    const csvText = await res.text();
    return parseCsvToObjects(csvText);
  }

  // ---- CSV parsing (handles quoted fields, embedded commas/newlines,
  // and "" escaped quotes — the format Google Sheets exports).

  function parseCsvToObjects(csvText){
    const rows = parseCsv(csvText);
    if (!rows.length) return [];
    const headers = rows[0];
    return rows.slice(1)
      .filter(r => r.some(cell => cell !== ""))
      .map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = r[i] !== undefined ? r[i] : ""; });
        return obj;
      });
  }

  function parseCsv(text){
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++){
      const c = text[i];
      if (inQuotes){
        if (c === '"'){
          if (text[i + 1] === '"'){ field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else {
        if (c === '"'){ inQuotes = true; }
        else if (c === ','){ row.push(field); field = ""; }
        else if (c === '\n'){ row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === '\r'){ /* skip, \n handles the break */ }
        else { field += c; }
      }
    }
    if (field !== "" || row.length){ row.push(field); rows.push(row); }
    return rows;
  }

  // ---- Normalizers: map raw rows (from a Sheet or local JSON) into a
  // stable shape the rendering layer can rely on. Column names coming
  // from Google Sheets are matched case/spacing-insensitively so the
  // committee can keep using natural header names in the spreadsheet.

  function pick(row, ...names){
    const keys = Object.keys(row || {});
    for (const name of names){
      const hit = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
      if (hit !== undefined && row[hit] !== undefined && row[hit] !== "") return row[hit];
    }
    return "";
  }

  function normCourse(row){
    return {
      name:   pick(row, "Course Name", "name"),
      domain: pick(row, "Domain", "domain") || "Uncategorized",
      price:  pick(row, "Price", "price"),
      rating: parseFloat(pick(row, "Rating", "rating")) || null,
      duration: pick(row, "Duration", "Course Duration", "duration"),
      link:   pick(row, "Course Link", "link", "url")
    };
  }

  function normCaseStudy(row){
    return {
      name:   pick(row, "Case Study Name", "name"),
      author: pick(row, "Author", "author"),
      link:   pick(row, "Link", "link", "url")
    };
  }

  function normRepo(row){
    return {
      name: pick(row, "Repository Name", "name"),
      description: pick(row, "Description", "description"),
      link: pick(row, "Link", "link", "url")
    };
  }

  function normResource(row){
    return {
      name: pick(row, "Resource Name", "name"),
      description: pick(row, "Description", "description"),
      resourceType: pick(row, "Resource Type", "type", "resource type") || "Resource",
      link: pick(row, "Link", "link", "url")
    };
  }

  function normCompetition(row){
    const scrapedAt = pick(row, "Scraped At", "scraped_at", "scrapedat");
    return {
      name: pick(row, "Competition Name", "name"),
      institute: pick(row, "Institute", "organising institute", "institute"),
      deadline: resolveDeadline(pick(row, "Deadline", "deadline"), scrapedAt),
      link: pick(row, "Link", "link", "url")
    };
  }

  // ---- Relative deadline resolution --------------------------------
  // Scraped sources sometimes provide a human, relative deadline string
  // (e.g. "24 days left", "1 Month Left", "2 Hours Left") alongside a
  // "Scraped At" timestamp for when that snapshot was taken, instead of
  // a fixed calendar date. This resolves that pair into a single,
  // absolute date (time is intentionally dropped — only the date the
  // deadline actually falls on matters downstream).
  //
  // A normal, already-parseable date (e.g. "2026-10-12") is left exactly
  // as-is and passes straight through, so existing sheet rows keep
  // working unchanged.

  const RELATIVE_DEADLINE_RE = /(\d+)\s*(hour|hours|hr|hrs|day|days|week|weeks|month|months|year|years)\s*left/i;

  function parseRelativeDeadline(text){
    const m = (text || "").toString().trim().match(RELATIVE_DEADLINE_RE);
    if (!m) return null;
    return { amount: parseInt(m[1], 10), unit: m[2].toLowerCase().replace(/s$/, "") };
  }

  function addToDate(base, amount, unit){
    const d = new Date(base.getTime());
    switch (unit){
      case "hour": case "hr": d.setHours(d.getHours() + amount); break;
      case "day":  d.setDate(d.getDate() + amount); break;
      case "week": d.setDate(d.getDate() + (amount * 7)); break;
      case "month": d.setMonth(d.getMonth() + amount); break;
      case "year": d.setFullYear(d.getFullYear() + amount); break;
    }
    return d;
  }

  function resolveDeadline(deadlineRaw, scrapedAtRaw){
    if (!deadlineRaw) return "";

    // Already an absolute, parseable date — pass through untouched.
    if (!isNaN(Date.parse(deadlineRaw))) return deadlineRaw;

    // Otherwise, try to interpret it as a relative offset from the
    // "Scraped At" timestamp (or from right now, if that's missing/bad).
    const rel = parseRelativeDeadline(deadlineRaw);
    if (rel){
      const scrapedAtMs = Date.parse(scrapedAtRaw);
      const base = isNaN(scrapedAtMs) ? new Date() : new Date(scrapedAtMs);
      return addToDate(base, rel.amount, rel.unit).toISOString();
    }

    // Unrecognized format — pass through as-is (matches old behavior).
    return deadlineRaw;
  }

  // Live Project stages. Put just the NUMBER in the sheet's "Status" column
  // — no need to type these labels out row after row:
  //   0 = Closed        (hidden from the site entirely, doesn't show on the status bar)
  //   1 = Applications Open
  //   2 = Selection Process Ongoing
  //   3 = Ongoing Project
  // Leaving "Status" blank defaults to 1 (Applications Open). The words
  // "Live"/"Closed" (used by older rows) still work too, for backward
  // compatibility.
  const LP_STAGES = {
    0: "Closed",
    1: "Applications Open",
    2: "Selection Process Ongoing",
    3: "Ongoing Project"
  };

  function parseStage(raw){
    const v = (raw == null ? "" : raw).toString().trim().toLowerCase();
    if (v === "") return 1;
    if (v === "0" || v === "closed") return 0;
    if (v === "1" || v === "live" || v === "open" || v === "applications open" || v === "application open") return 1;
    if (v === "2" || v === "selection process ongoing" || v === "selection ongoing" || v === "selection") return 2;
    if (v === "3" || v === "ongoing project" || v === "project ongoing" || v === "ongoing") return 3;
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 0 && n <= 3) return n;
    return 1; // unrecognized text defaults to "Applications Open" rather than hiding the row
  }

  function normLiveProject(row){
    const stage = parseStage(pick(row, "Status", "status"));
    return {
      id: pick(row, "ID", "id") || slugify(pick(row, "Company", "company") + "-" + pick(row, "Project/Role", "role")),
      company: pick(row, "Company", "company"),
      stage: stage,
      stageLabel: LP_STAGES[stage],
      status: (pick(row, "Status", "status") || "Live"),
      tagline: pick(row, "Tagline", "opening", "about the company summary"),
      aboutCompany: pick(row, "About the Company", "about"),
      roles: parseRoles(row),
      selectionCriteria: splitLines(pick(row, "Selection Criteria", "selection criteria")),
      location: pick(row, "Location", "location") || "Remote",
      duration: pick(row, "Project Duration", "duration"),
      applyUrl: pick(row, "Apply URL", "apply link", "application link"),
      deadline: resolveDeadline(pick(row, "Deadline", "application deadline"), pick(row, "Scraped At", "scraped_at", "scrapedat")),
      googleDocUrl: pick(row, "Google Doc URL", "google doc")
    };
  }

  function parseRoles(row){
    // Supports any number of "Role N" column sets (Role 1, Role 2, Role 3,
    // Role 4, ...) — just keeps checking increasing numbers until it hits
    // one that isn't filled in. Add as many "Role N / Role N Responsibilities /
    // Role N Takeaways" column triples to the sheet as you need; no code
    // change required.
    const roles = [];
    let n = 1;
    while (true){
      const title = pick(row, `Role ${n}`, `role${n}`);
      if (!title) break;
      roles.push({
        title,
        responsibilities: splitLines(pick(row, `Role ${n} Responsibilities`, `role${n} responsibilities`, `key responsibilities ${n}`)),
        takeaway: pick(row, `Role ${n} Takeaways`, `role${n} takeaway`, `takeaways ${n}`, "Takeaways / Stipend")
      });
      n++;
    }
    if (roles.length === 0){
      const single = pick(row, "Role", "roles");
      if (single){
        roles.push({
          title: single,
          responsibilities: splitLines(pick(row, "Key Responsibilities", "responsibilities")),
          takeaway: pick(row, "Takeaways", "takeaways / stipend", "stipend")
        });
      }
    }
    return roles;
  }

  function splitLines(text){
    if (!text) return [];
    return text
      .split(/\r?\n|;|•/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function slugify(text){
    return (text || "item")
      .toString().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function parseDeadline(d){
    const t = Date.parse(d);
    return isNaN(t) ? Infinity : t;
  }

  // ---- Public getters -------------------------------------------------

  async function getCourses(){
    const rows = await fetchSource("courses");
    return rows.map(normCourse);
  }

  async function getCaseStudies(){
    const rows = await fetchSource("caseStudies");
    return rows.map(normCaseStudy);
  }

  async function getGithubRepos(){
    const rows = await fetchSource("githubRepos");
    return rows.map(normRepo);
  }

  async function getResources(){
    const rows = await fetchSource("resources");
    return rows.map(normResource);
  }

  async function getCompetitions(){
    const rows = await fetchSource("competitions");
    return rows.map(normCompetition).sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
  }

  async function getLiveProjects(){
    const rows = await fetchSource("liveProjects");
    return rows.map(normLiveProject)
      .filter(p => p.stage !== 0)
      .sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
  }

  async function getLiveProjectById(id){
    const all = await getLiveProjects();
    return all.find(p => p.id === id) || null;
  }

  return {
    getCourses, getCaseStudies, getGithubRepos, getResources,
    getCompetitions, getLiveProjects, getLiveProjectById,
    slugify
  };
})();
