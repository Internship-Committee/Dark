/* ============================================================
   Renders the Course Repository grid from ICData.getCourses()
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("courses-grid");
  const filterBar = document.getElementById("domain-filter");
  const exploration = document.getElementById("course-exploration");
  const paths = document.getElementById("course-paths");
  if (!grid) return;

  grid.innerHTML = skeletonGrid(6);

  let courses = [];
  try{
    courses = await ICData.getCourses();
  }catch(err){
    if (exploration) exploration.hidden = true;
    grid.innerHTML = `<div class="state-msg is-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  if (!courses.length){
    if (exploration) exploration.hidden = true;
    grid.innerHTML = `<div class="state-msg">No courses are listed yet. Once the Course Repository sheet has rows, they'll appear here automatically.</div>`;
    return;
  }

  const domains = ["All", ...Array.from(new Set(courses.map(c => c.domain || "Uncategorized")))];
  let activeDomain = "All";

  renderCoursePaths();

  function renderFilters(){
    if (!filterBar) return;
    filterBar.innerHTML = domains.map(d =>
      `<button class="domain-pill${d === activeDomain ? " is-active" : ""}" data-domain="${escapeHtml(d)}" aria-pressed="${d === activeDomain}">${escapeHtml(d)}</button>`
    ).join("");
    filterBar.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeDomain = btn.getAttribute("data-domain");
        renderFilters();
        renderGrid();
        updatePathSelection();
      });
    });
  }

  function renderCoursePaths(){
    if (!exploration || !paths) return;
    const visibleDomains = domains.slice(1, 9);
    if (!visibleDomains.length) return;

    paths.dataset.count = String(visibleDomains.length);
    paths.innerHTML = visibleDomains.map((domain, index) => {
      const count = courses.filter(course => (course.domain || "Uncategorized") === domain).length;
      const photo = coursePhotoForDomain(domain, index);
      return `
        <button class="course-path" type="button" data-domain="${escapeHtml(domain)}" aria-pressed="false" aria-controls="courses-grid" aria-label="Show ${count} ${count === 1 ? "course" : "courses"} in ${escapeHtml(domain)}" style="--course-photo:url('${photo}')">
          <span class="course-path__image" aria-hidden="true"></span>
          <span class="course-path__shade" aria-hidden="true"></span>
          <span class="course-path__eyebrow"><span>${count} ${count === 1 ? "course" : "courses"}</span><span class="course-path__arrow" aria-hidden="true">↗</span></span>
          <span class="course-path__title">${escapeHtml(domain)}</span>
          <span class="course-path__detail">Explore this subject in the course list.</span>
        </button>
      `;
    }).join("");

    paths.querySelectorAll(".course-path").forEach(button => {
      button.addEventListener("click", () => {
        activeDomain = button.getAttribute("data-domain");
        renderFilters();
        renderGrid();
        updatePathSelection();
        document.querySelector(".course-list-heading")?.scrollIntoView({ behavior:"smooth", block:"start" });
      });
    });
    exploration.hidden = false;
  }

  function updatePathSelection(){
    paths?.querySelectorAll(".course-path").forEach(button => {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-domain") === activeDomain));
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

const coursePhotoOptions = [
  { match:/finance|account|invest|econom|bank/i, url:"photo-1460925895917-afdab827c52f" },
  { match:/market|brand|sales|advertis/i, url:"photo-1533750349088-cd871a92f312" },
  { match:/consult|strategy|management/i, url:"photo-1454165804606-c3d57bc86b40" },
  { match:/data|analytics|business intelligence/i, url:"photo-1551288049-bebda4e38f71" },
  { match:/leadership|entrepreneur|startup/i, url:"photo-1521737711867-e3b97375f902" },
  { match:/operation|supply|project/i, url:"photo-1556761175-b413da4baf72" },
];

function coursePhotoForDomain(domain, index){
  const image = coursePhotoOptions.find(option => option.match.test(domain)) || coursePhotoOptions[index % coursePhotoOptions.length];
  return `https://images.unsplash.com/${image.url}?auto=format&fit=crop&w=1100&q=82`;
}

function formatCourseDuration(duration){
  const value = String(duration || "").trim();
  if (!value) return "";
  if (/^\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?$/.test(value)) return `${value} hours`;
  return value.replace(/\bhrs?\b/gi, "hours");
}
