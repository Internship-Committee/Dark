document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("lp-grid");
  const search = document.getElementById("lp-search");
  const count = document.getElementById("lp-search-count");
  const filters = Array.from(document.querySelectorAll(".lp-status-filter"));
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);

  try{
    const items = await ICData.getLiveProjects();
    if (!items.length){
      grid.innerHTML = `<div class="state-msg">No live projects at the moment. New rows added to the Live Projects sheet will appear here automatically, ordered by application deadline.</div>`;
      return;
    }

    const stageShort = { 1: "Applications open", 2: "Selection in progress", 3: "Project ongoing" };
    let activeStage = "all";
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
            <span class="lp-file-brand">${logo}</span>
            <span class="lp-file-company">${escapeHtml(p.company)}</span>
          </a>
          <div class="lp-file-meta">
            <span class="lp-file-status stage-${p.stage}"><span class="pulse-dot"></span>${escapeHtml(stageShort[p.stage] || "Live project")}</span>
          </div>
        </article>`;
    };

    const render = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const matches = items.filter(p => (activeStage === "all" || String(p.stage) === activeStage) && (!query || searchableText(p).includes(query)));
      grid.innerHTML = matches.length
        ? matches.map(cardMarkup).join("")
        : `<div class="state-msg lp-empty-search">${query ? `No projects match “${escapeHtml(search.value.trim())}”. Try a company, role or location.` : "There are no projects in this status right now."}</div>`;
      grid.querySelectorAll(".lp-file-card").forEach(card => {
        card.addEventListener("pointermove", event => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          card.style.setProperty("--pointer-x", `${(x * 100).toFixed(1)}%`);
          card.style.setProperty("--pointer-y", `${(y * 100).toFixed(1)}%`);
          card.style.setProperty("--tilt-x", `${((x - 0.5) * 3).toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${((0.5 - y) * 3).toFixed(2)}deg`);
        });
        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--pointer-x", "50%");
          card.style.setProperty("--pointer-y", "40%");
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
        });
      });
      if (count) count.textContent = query || activeStage !== "all"
        ? `${matches.length} ${matches.length === 1 ? "project" : "projects"}`
        : `${items.length} ${items.length === 1 ? "project" : "projects"}`;
    };

    render();
    search?.addEventListener("input", render);
    filters.forEach(button => button.addEventListener("click", () => {
      activeStage = button.dataset.stage || "all";
      filters.forEach(filter => {
        const selected = filter === button;
        filter.classList.toggle("is-active", selected);
        filter.setAttribute("aria-pressed", String(selected));
      });
      render();
    }));
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
  }
});

function formatDate(d){
  const t = new Date(d);
  if (isNaN(t.getTime())) return d;
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
