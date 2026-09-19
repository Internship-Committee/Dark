document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("lp-grid");
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);
  try{
    const items = await ICData.getLiveProjects();
    if (!items.length){
      grid.innerHTML = `<div class="state-msg">No live projects at the moment. New rows added to the Live Projects sheet will appear here automatically, ordered by application deadline.</div>`;
      return;
    }
    grid.innerHTML = items.map(p => `
      <a class="glass-card lp-card" href="live-project.html?id=${encodeURIComponent(p.id)}">
        <span class="live-flag"><span class="pulse-dot"></span> LIVE</span>
        <h3>${escapeHtml(p.company)}</h3>
        ${p.roles.length ? `<span class="role-line">${escapeHtml(p.roles.map(r=>r.title).join(" · "))}</span>` : ""}
        <div class="lp-meta-row">
          <span class="meta-chip">${ICIcons.pin} ${escapeHtml(p.location)}</span>
          ${p.duration ? `<span class="meta-chip">${ICIcons.clock} ${escapeHtml(p.duration)}</span>` : ""}
        </div>
        ${p.deadline ? `<span class="lp-deadline">Apply by ${escapeHtml(formatDate(p.deadline))}</span>` : ""}
        <span class="card-link">View project ${ICIcons.arrowRight}</span>
      </a>
    `).join("");
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
  }
});

function formatDate(d){
  const t = new Date(d);
  if (isNaN(t.getTime())) return d;
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
