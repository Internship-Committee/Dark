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
    grid.innerHTML = list.map((c, index) => `
      <article class="glass-card course-card">
        <span class="course-number" aria-label="Serial number ${index + 1}">${String(index + 1).padStart(2, "0")}</span>
        <div class="course-name-cell">
          ${activeDomain === "All" ? `<span class="domain-tag">${escapeHtml(c.domain || "Uncategorized")}</span>` : ""}
          <h3>${escapeHtml(c.name)}</h3>
        </div>
        <span class="course-rating" data-label="Rating">${c.rating ? `<span class="rating" role="img" aria-label="Rating ${c.rating.toFixed(1)} out of 5">${ratingStars(c.rating)}</span>` : "—"}</span>
        <span class="course-duration" data-label="Duration" aria-label="Duration: ${escapeHtml(formatCourseDuration(c.duration) || "Not listed")}">${escapeHtml(formatCourseDuration(c.duration) || "—")}</span>
        <a class="card-link icon-link" href="${escapeHtml(c.link)}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(c.name)} course" title="Open course">
          ${ICIcons.externalLink}
        </a>
      </article>
    `).join("");
  }

  renderFilters();
  renderGrid();
});

function formatCourseDuration(duration){
  const value = String(duration || "").trim();
  if (!value) return "";
  if (/^\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?$/.test(value)) return `${value} hours`;
  return value.replace(/\bhrs?\b/gi, "hours");
}
