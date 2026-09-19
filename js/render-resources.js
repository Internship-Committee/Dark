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
        <span class="login-badge ${r.loginRequired ? "required" : "not-required"}">
          ${r.loginRequired ? "College login required" : "No college login"}
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
