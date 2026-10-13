/* ============================================================
   Renders the Course Repository and its full-screen domain views.
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("courses-grid");
  const filterBar = document.getElementById("domain-filter");
  const exploration = document.getElementById("course-exploration");
  const paths = document.getElementById("course-paths");
  const domainView = document.getElementById("course-domain-view");
  const pageHeader = document.querySelector("#main-content .page-header");
  const main = document.getElementById("main-content");
  const sidebar = document.querySelector(".sidebar");
  const mobileTopbar = document.querySelector(".mobile-topbar");
  if (!grid) return;

  const artwork = [
    "https://cdn.21st.dev/assets/mirror/21/21bf561c0452c2fae65a5c747aeba0996e6942fcb8eb3e628c50478f458065c5.jpg",
    "https://cdn.21st.dev/assets/mirror/7c/7c873d1af9cfb98c26de10dc98e807bcec8de8321936158d1b0e82c6b7f73d0c.jpg",
    "https://cdn.21st.dev/assets/mirror/35/350edca6de5b00194dbba8be86d6fc51f9192901ed127fd67855f369ff3bc9e5.jpg",
    "https://cdn.21st.dev/assets/mirror/dc/dc1338c2544ff95224a36bff0cd432e122417e6250bfd0ff82fbfceacfbf3283.jpg",
    "https://cdn.21st.dev/assets/mirror/ba/ba6557999b707efbaa73506debbc594e0703c071fdfc05951c9b355f0ad078e8.jpg",
    "https://cdn.21st.dev/assets/mirror/67/676c45dea273e8467aa434fbd08669408fe0a8b9151902e3ac39c7dc74cab416.jpg"
  ];
  const descriptions = {
    "Finance": "Build confidence with courses in financial analysis, markets, and valuation.",
    "Marketing": "Explore the ideas and tools behind strong brands, campaigns, and customer insight.",
    "Consulting": "Strengthen structured problem solving, communication, and case interview skills.",
    "Entrepreneurship": "Learn how to shape, test, and grow ideas into sustainable ventures.",
    "Leadership": "Develop the people, decision making, and organizational skills to lead well.",
    "Data Analytics": "Turn data into clear analysis and practical decisions with focused technical courses.",
    "Business Analytics": "Use analytical tools to understand business performance and solve real problems.",
    "Operations Management": "Improve the systems, processes, and quality that keep organizations moving."
  };
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let courses = [];
  let domains = [];
  let activeDomain = "All";
  let currentDomain = null;
  let originatingCard = null;
  let originatingImage = null;
  let directEntry = false;
  let waitingForHistory = false;

  grid.innerHTML = skeletonGrid(6);

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

  domains = Array.from(new Set(courses.map(course => course.domain || "Uncategorized")));
  renderDomainTiles();
  renderFilters();
  renderGrid();
  exploration.hidden = false;

  const initialDomain = domainFromUrl();
  if (initialDomain){
    directEntry = true;
    history.replaceState({ ...(history.state || {}), courseDomain: true, domain: initialDomain }, "", location.href);
    openDomain(initialDomain, findDomainCard(initialDomain), { push: false, animate: false });
  }

  function renderDomainTiles(){
    if (!exploration || !paths) return;

    paths.dataset.count = String(domains.length);
    paths.innerHTML = domains.map((domain, index) => {
      const count = courses.filter(course => (course.domain || "Uncategorized") === domain).length;
      const image = artwork[index % artwork.length];
      return `
        <button class="course-domain-card" type="button" data-domain="${escapeHtml(domain)}" data-index="${index}" aria-label="Explore ${escapeHtml(domain)}, ${count} ${count === 1 ? "course" : "courses"}">
          <img class="course-domain-card__image" src="${image}" alt="" loading="lazy">
          <span class="course-domain-card__shade" aria-hidden="true"></span>
          <span class="course-domain-card__content">
            <span class="course-domain-card__count">${String(count).padStart(2, "0")} ${count === 1 ? "course" : "courses"}</span>
            <span class="course-domain-card__title">${escapeHtml(domain)}</span>
            <span class="course-domain-card__action" aria-hidden="true">Explore <span>↗</span></span>
          </span>
        </button>
      `;
    }).join("");

    paths.querySelectorAll(".course-domain-card").forEach(card => {
      card.addEventListener("click", () => openDomain(card.dataset.domain, card));
    });
    paths.querySelectorAll(".course-domain-card__image").forEach(image => {
      image.addEventListener("error", () => { image.hidden = true; }, { once: true });
    });
  }

  function renderFilters(){
    if (!filterBar) return;
    const filterDomains = ["All", ...domains];
    filterBar.innerHTML = filterDomains.map(domain =>
      `<button class="domain-pill${domain === activeDomain ? " is-active" : ""}" data-domain="${escapeHtml(domain)}" aria-pressed="${domain === activeDomain}">${escapeHtml(domain)}</button>`
    ).join("");
    filterBar.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => {
        activeDomain = button.getAttribute("data-domain");
        renderFilters();
        renderGrid();
      });
    });
  }

  function renderGrid(){
    const list = activeDomain === "All" ? courses : courses.filter(course => (course.domain || "Uncategorized") === activeDomain);
    if (!list.length){
      grid.innerHTML = `<div class="state-msg">No courses in this domain yet.</div>`;
      return;
    }
    grid.innerHTML = courseRows(list, activeDomain === "All");
  }

  function courseRows(list, showDomain){
    return list.map((course, index) => `
      <article class="glass-card course-card">
        <span class="course-number" aria-label="Serial number ${index + 1}">${String(index + 1).padStart(2, "0")}</span>
        <div class="course-name-cell">
          ${showDomain ? `<span class="domain-tag">${escapeHtml(course.domain || "Uncategorized")}</span>` : ""}
          <h3>${escapeHtml(course.name)}</h3>
        </div>
        <span class="course-rating" data-label="Rating">${course.rating ? `<span class="rating" role="img" aria-label="Rating ${course.rating.toFixed(1)} out of 5">${ratingStars(course.rating)}</span>` : "—"}</span>
        <span class="course-duration" data-label="Duration" aria-label="Duration: ${escapeHtml(formatCourseDuration(course.duration) || "Not listed")}">${escapeHtml(formatCourseDuration(course.duration) || "—")}</span>
        <a class="card-link icon-link" href="${escapeHtml(course.link)}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(course.name)} course" title="Open course">
          ${ICIcons.externalLink}
        </a>
      </article>
    `).join("");
  }

  function openDomain(domain, card, options = {}){
    const actualDomain = domains.find(item => item.toLocaleLowerCase() === String(domain || "").toLocaleLowerCase());
    if (!actualDomain || !domainView) return;

    const image = card?.querySelector(".course-domain-card__image") || null;
    const imageSrc = image?.currentSrc || image?.src || artwork[domains.indexOf(actualDomain) % artwork.length];
    originatingCard = card || findDomainCard(actualDomain);
    originatingImage = originatingCard?.querySelector(".course-domain-card__image") || null;
    if (originatingImage) originatingImage.style.viewTransitionName = "course-domain-cover";

    const update = () => {
      currentDomain = actualDomain;
      domainView.classList.remove("is-entering", "is-leaving");
      const collection = courses.filter(course => (course.domain || "Uncategorized") === actualDomain);
      const description = descriptions[actualDomain] || `Browse courses selected for ${actualDomain.toLocaleLowerCase()}.`;
      domainView.innerHTML = `
        <div class="course-domain-view__cover">
          <img class="course-domain-view__image" src="${imageSrc}" alt="" style="view-transition-name:course-domain-cover">
          <div class="course-domain-view__veil" aria-hidden="true"></div>
          <div class="course-domain-view__cover-content">
            <button class="course-domain-view__back" type="button" data-close-domain><span aria-hidden="true">←</span> All domains</button>
            <div class="course-domain-view__title-block">
              <span class="course-domain-view__eyebrow">Course repository <span>/</span> ${collection.length} ${collection.length === 1 ? "course" : "courses"}</span>
              <h1 id="course-domain-title">${escapeHtml(actualDomain)}</h1>
              <p>${escapeHtml(description)}</p>
            </div>
          </div>
        </div>
        <div class="course-domain-view__content">
          <div class="course-domain-view__section-heading">
            <span class="eyebrow">${String(collection.length).padStart(2, "0")} courses</span>
            <h2>Build your ${escapeHtml(actualDomain.toLocaleLowerCase())} toolkit.</h2>
          </div>
          <div class="editorial-list-heading course-list-heading">
            <span>S.no</span><span>Course name</span><span>Rating</span><span>Duration</span><span role="img" aria-label="Course link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg></span>
          </div>
          <div class="card-grid indexed" id="course-domain-courses" aria-live="polite">${collection.length ? courseRows(collection, false) : `<div class="state-msg">No courses are listed for this domain yet.</div>`}</div>
          <footer class="course-domain-view__footer"><span>Internship Committee, IIM Rohtak</span><button type="button" data-close-domain>Back to all domains <span aria-hidden="true">↗</span></button></footer>
        </div>
      `;
      const coverImage = domainView.querySelector(".course-domain-view__image");
      coverImage?.addEventListener("error", () => { coverImage.hidden = true; }, { once: true });
      domainView.hidden = false;
      main.inert = true;
      if (sidebar) sidebar.inert = true;
      if (mobileTopbar) mobileTopbar.inert = true;
      document.body.classList.add("course-domain-open");
      if (pageHeader) pageHeader.hidden = true;
      if (exploration) exploration.hidden = true;
      if (filterBar) filterBar.hidden = true;
      grid.parentElement.querySelector(".course-list-heading")?.setAttribute("hidden", "");
      grid.hidden = true;
      if (options.animate !== false && !document.startViewTransition && !prefersReducedMotion.matches){
        domainView.classList.add("is-entering");
      }

      domainView.querySelectorAll("[data-close-domain]").forEach(button => button.addEventListener("click", requestClose));
      domainView.querySelector("[data-close-domain]")?.focus({ preventScroll: true });

      if (options.push !== false){
        const url = new URL(location.href);
        url.searchParams.set("domain", actualDomain);
        history.pushState({ ...(history.state || {}), courseDomain: true, domain: actualDomain }, "", url);
        directEntry = false;
      }
    };

    transition(update, options.animate !== false);
  }

  function requestClose(){
    if (waitingForHistory || !currentDomain) return;
    if (directEntry){
      const url = new URL(location.href);
      url.searchParams.delete("domain");
      history.replaceState({ ...(history.state || {}), courseDomain: false }, "", url);
      directEntry = false;
      closeDomain();
      return;
    }
    if (history.state?.courseDomain){
      waitingForHistory = true;
      history.back();
      return;
    }
    closeDomain();
  }

  function closeDomain(){
    const returnCard = originatingCard;
    domainView.classList.remove("is-entering", "is-leaving");
    const update = () => {
      domainView.hidden = true;
      domainView.innerHTML = "";
      currentDomain = null;
      main.inert = false;
      if (sidebar) sidebar.inert = false;
      if (mobileTopbar) mobileTopbar.inert = false;
      document.body.classList.remove("course-domain-open");
      if (pageHeader) pageHeader.hidden = false;
      if (exploration) exploration.hidden = false;
      if (filterBar) filterBar.hidden = false;
      grid.parentElement.querySelector(".course-list-heading")?.removeAttribute("hidden");
      grid.hidden = false;
    };

    const finish = () => {
      domainView.classList.remove("is-entering", "is-leaving");
      if (originatingImage) originatingImage.style.viewTransitionName = "";
      originatingImage = null;
      originatingCard = null;
      waitingForHistory = false;
      returnCard?.focus({ preventScroll: true });
    };

    if (!document.startViewTransition && !prefersReducedMotion.matches){
      domainView.classList.add("is-leaving");
      window.setTimeout(() => {
        update();
        finish();
      }, 260);
    }else{
      transition(update, true).then(finish);
    }
  }

  function transition(update, animate){
    if (animate && document.startViewTransition && !prefersReducedMotion.matches){
      const viewTransition = document.startViewTransition(update);
      return viewTransition.finished.catch(() => {});
    }
    update();
    return Promise.resolve();
  }

  function domainFromUrl(){
    const requested = new URL(location.href).searchParams.get("domain");
    return domains.find(domain => domain.toLocaleLowerCase() === String(requested || "").toLocaleLowerCase()) || null;
  }

  function findDomainCard(domain){
    return Array.from(paths?.querySelectorAll(".course-domain-card") || []).find(card => card.dataset.domain === domain) || null;
  }

  window.addEventListener("popstate", () => {
    const requested = domainFromUrl();
    if (requested){
      waitingForHistory = false;
      directEntry = false;
      if (currentDomain !== requested) openDomain(requested, findDomainCard(requested), { push: false });
    }else if (currentDomain){
      waitingForHistory = false;
      directEntry = false;
      closeDomain();
    }
  });

  document.addEventListener("keydown", event => {
    if (!currentDomain || domainView.hidden) return;
    if (event.key === "Escape"){
      event.preventDefault();
      requestClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(domainView.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first){
      event.preventDefault();
      last.focus();
    }else if (!event.shiftKey && document.activeElement === last){
      event.preventDefault();
      first.focus();
    }
  });
});

function formatCourseDuration(duration){
  const value = String(duration || "").trim();
  if (!value) return "";
  if (/^\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?$/.test(value)) return `${value} hours`;
  return value.replace(/\bhrs?\b/gi, "hours");
}
