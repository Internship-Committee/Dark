document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("github-grid");
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);
  try{
    const items = await ICData.getGithubRepos();
    if (!items.length){
      grid.innerHTML = `<div class="state-msg">No repositories listed yet. New rows added to the GitHub Repositories sheet will appear here automatically.</div>`;
      return;
    }
    grid.innerHTML = items.map(r => `
      <article class="glass-card list-card">
        <h3>${escapeHtml(r.name)}</h3>
        ${r.description ? `<p class="desc">${escapeHtml(r.description)}</p>` : ""}
        <a class="card-link" href="${escapeHtml(r.link)}" target="_blank" rel="noopener">
          View repository ${ICIcons.externalLink}
        </a>
      </article>
    `).join("");
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
  }
});
