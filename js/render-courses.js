/* ============================================================
   Renders the Course Repository grid from ICData.getCourses()
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("courses-grid");
  const filterBar = document.getElementById("domain-filter");
  if (!grid) return;

  grid.innerHTML = skeletonGrid(6);

  let courses = [];
  try{
    courses = await ICData.getCourses();
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  if (!courses.length){
    grid.innerHTML = `<div class="state-msg">No courses are listed yet. Once the Course Repository sheet has rows, they'll appear here automatically.</div>`;
    return;
  }

  const domains = ["All", ...Array.from(new Set(courses.map(c => c.domain || "Uncategorized")))];
  let activeDomain = "All";

  function renderFilters(){
    if (!filterBar) return;
    filterBar.innerHTML = domains.map(d =>
      `<button class="domain-pill${d === activeDomain ? " is-active" : ""}" data-domain="${escapeHtml(d)}">${escapeHtml(d)}</button>`
    ).join("");
    filterBar.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeDomain = btn.getAttribute("data-domain");
        renderFilters();
        renderGrid();
      });
    });
  }

  function renderGrid(){
    const list = activeDomain === "All" ? courses : courses.filter(c => (c.domain || "Uncategorized") === activeDomain);
    if (!list.length){
      grid.innerHTML = `<div class="state-msg">No courses in this domain yet.</div>`;
      return;
    }
    grid.innerHTML = list.map(c => `
      <article class="glass-card course-card">
        <span class="domain-tag">${escapeHtml(c.domain || "Uncategorized")}</span>
        <h3>${escapeHtml(c.name)}</h3>
        <div class="course-row">
          ${c.price ? `<span class="price-chip">${escapeHtml(c.price)}</span>` : `<span></span>`}
          ${c.rating ? `<span class="rating">${ratingStars(c.rating)}</span>` : ""}
        </div>
        <a class="card-link" href="${escapeHtml(c.link)}" target="_blank" rel="noopener">
          View course ${ICIcons.externalLink}
        </a>
      </article>
    `).join("");
  }

  renderFilters();
  renderGrid();
});
