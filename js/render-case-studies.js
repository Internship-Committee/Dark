document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("case-studies-grid");
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);
  try{
    const items = await ICData.getCaseStudies();
    if (!items.length){
      grid.innerHTML = `<div class="state-msg">No case studies listed yet. New rows added to the Case Studies sheet will appear here automatically.</div>`;
      return;
    }
    grid.innerHTML = items.map((c, index) => `
      <article class="glass-card list-card">
        <span class="list-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(c.name)}</h3>
        <p class="meta">${escapeHtml(c.author || "Unknown author")}</p>
        <a class="card-link icon-link" href="${escapeHtml(c.link)}" target="_blank" rel="noopener" aria-label="Read ${escapeHtml(c.name)} case study" title="Read case study">
          ${ICIcons.externalLink}
        </a>
      </article>
    `).join("");
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
  }
});
