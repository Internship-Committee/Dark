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
    const loginRaw = (pick(row, "College Login Required", "login") || "").toString().trim().toLowerCase();
    return {
      name: pick(row, "Resource Name", "name"),
      description: pick(row, "Description", "description"),
      loginRequired: ["yes", "y", "true", "required"].includes(loginRaw),
      link: pick(row, "Link", "link", "url")
    };
  }

  function normCompetition(row){
    return {
      name: pick(row, "Competition Name", "name"),
      institute: pick(row, "Institute", "organising institute", "institute"),
      deadline: pick(row, "Deadline", "deadline"),
      link: pick(row, "Link", "link", "url")
    };
  }

  function normLiveProject(row){
    const rolesRaw = pick(row, "Roles", "role", "project/role");
    return {
      id: pick(row, "ID", "id") || slugify(pick(row, "Company", "company") + "-" + pick(row, "Project/Role", "role")),
      company: pick(row, "Company", "company"),
      status: (pick(row, "Status", "status") || "Live"),
      tagline: pick(row, "Tagline", "opening", "about the company summary"),
      aboutCompany: pick(row, "About the Company", "about"),
      jobDescription: pick(row, "Job Description", "job description"),
      roles: parseRoles(row),
      selectionCriteria: splitLines(pick(row, "Selection Criteria", "selection criteria")),
      location: pick(row, "Location", "location") || "Remote",
      duration: pick(row, "Project Duration", "duration"),
      applyUrl: pick(row, "Apply URL", "apply link", "application link"),
      deadline: pick(row, "Deadline", "application deadline"),
      policyNote: pick(row, "Policy Note", "important note", "important ic policy note"),
      googleDocUrl: pick(row, "Google Doc URL", "google doc")
    };
  }

  function parseRoles(row){
    // Supports either a single "Roles" JSON-ish field, or up to two
    // role columns (Role 1 / Role 2 + their responsibilities/takeaways)
    // depending on how the committee's sheet is structured.
    const roles = [];
    for (const n of [1, 2, 3]){
      const title = pick(row, `Role ${n}`, `role${n}`);
      if (!title) continue;
      roles.push({
        title,
        responsibilities: splitLines(pick(row, `Role ${n} Responsibilities`, `role${n} responsibilities`, `key responsibilities ${n}`)),
        takeaway: pick(row, `Role ${n} Takeaways`, `role${n} takeaway`, `takeaways ${n}`, "Takeaways / Stipend")
      });
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
      .filter(p => (p.status || "").toLowerCase() !== "closed")
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
