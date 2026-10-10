document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("lp-grid");
  const search = document.getElementById("lp-search");
  const count = document.getElementById("lp-search-count");
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);

  try{
    const items = await ICData.getLiveProjects();
    if (!items.length){
      grid.innerHTML = `<div class="state-msg">No live projects at the moment. New rows added to the Live Projects sheet will appear here automatically, ordered by application deadline.</div>`;
      return;
    }

    const stageShort = { 1: "Applications open", 2: "Selection in progress", 3: "Project ongoing" };
    const searchableText = p => [p.company, p.tagline, p.aboutCompany, p.location, p.duration,
      p.stageLabel, ...p.roles.flatMap(role => [role.title, role.responsibilities.join(" "), role.takeaway]),
      ...p.selectionCriteria].join(" ").toLowerCase();
    const cardMarkup = p => {
      const logo = p.companyLogo
        ? `<img class="lp-file-logo" src="${escapeHtml(p.companyLogo)}" alt="${escapeHtml(p.company)} logo" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">`
        : "";
      return `
        <article class="lp-project-item">
          <a class="lp-file-card" href="live-project.html?id=${encodeURIComponent(p.id)}" aria-label="View ${escapeHtml(p.company)} live project">
            <span class="lp-file-tab" aria-hidden="true"></span>
            <span class="lp-file-brand">${logo}</span>
            <span class="lp-file-company">${escapeHtml(p.company)}</span>
            <span class="lp-file-open" aria-hidden="true">${ICIcons.arrowRight}</span>
          </a>
          <div class="lp-file-meta">
            <span class="lp-file-status stage-${p.stage}"><span class="pulse-dot"></span>${escapeHtml(stageShort[p.stage] || "Live project")}</span>
          </div>
        </article>`;
    };

    const render = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const matches = items.filter(p => !query || searchableText(p).includes(query));
      grid.innerHTML = matches.length
        ? matches.map(cardMarkup).join("")
        : `<div class="state-msg lp-empty-search">No projects match “${escapeHtml(search.value.trim())}”. Try a company, role or location.</div>`;
      if (count) count.textContent = query ? `${matches.length} ${matches.length === 1 ? "result" : "results"}` : `${items.length} ${items.length === 1 ? "project" : "projects"}`;
    };

    render();
    search?.addEventListener("input", render);
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
  }
});

function formatDate(d){
  const t = new Date(d);
  if (isNaN(t.getTime())) return d;
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
