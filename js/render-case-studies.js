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
    grid.dataset.count = String(items.length);
    grid.innerHTML = items.map((c, index) => {
      const shape = items.length === 2 ? "square" : items.length === 1 || index % 2 === 1 ? "rectangle" : "square";
      return `
        <a class="course-path case-study-tile" data-shape="${shape}" href="${escapeHtml(c.link)}" target="_blank" rel="noopener" aria-label="Read ${escapeHtml(c.name)} case study by ${escapeHtml(c.author || "Unknown author")} in a new tab">
          <span class="course-path__eyebrow">Case study <span>·</span> ${String(index + 1).padStart(2, "0")}</span>
          <span class="course-path__title">${escapeHtml(c.name)}</span>
          <span class="course-path__detail">${escapeHtml(c.author || "Unknown author")}</span>
          <span class="course-path__arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join("");
  }catch(err){
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
  }
});
