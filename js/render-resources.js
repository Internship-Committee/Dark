document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("resources-grid");
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);
  try{
    const items = await ICData.getResources();
    if (!items.length){
      grid.innerHTML = `<div class="state-msg">No resources listed yet. New rows added to the IIMR Student Resources sheet will appear here automatically.</div>`;
      return;
    }
    grid.innerHTML = items.map(r => `
      <article class="glass-card list-card">
        <span class="resource-type-badge ${typeClass(r.resourceType)}">
          ${escapeHtml(r.resourceType)}
        </span>
        <h3>${escapeHtml(r.name)}</h3>
        ${r.description ? `<p class="desc">${escapeHtml(r.description)}</p>` : ""}
        <a class="card-link" href="${escapeHtml(r.link)}" target="_blank" rel="noopener">
          Open resource ${ICIcons.externalLink}
        </a>
      </article>
    `).join("");
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
  }
});

// Turns a resource type like "E-Database" or "Online Journals" into a
// CSS-friendly class name ("e-database", "online-journals"). Unknown /
// future types (anything not styled explicitly in components.css) still
// get a sensible default look via the base ".resource-type-badge" rule —
// no code change needed when the committee adds a new type to the sheet.
function typeClass(type){
  return "type-" + (type || "resource")
    .toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
