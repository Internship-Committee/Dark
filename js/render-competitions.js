document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("competitions-grid");
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);
  try{
    const items = await ICData.getCompetitions();
    if (!items.length){
      grid.innerHTML = `<div class="state-msg">No competitions listed yet. New rows added to the Case Competitions sheet will appear here automatically.</div>`;
      return;
    }
    grid.innerHTML = items.map(c => `
      <article class="glass-card competition-card">
        <h3>${escapeHtml(c.name)}</h3>
        <p class="institute">${escapeHtml(c.institute)}</p>
        ${c.deadline ? `<span class="deadline-pill">${ICIcons.calendar} ${escapeHtml(formatDate(c.deadline))}</span>` : ""}
        <a class="card-link" href="${escapeHtml(c.link)}" target="_blank" rel="noopener">
          Competition details ${ICIcons.externalLink}
        </a>
      </article>
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
