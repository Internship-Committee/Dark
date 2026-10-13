/* ============================================================
   Domain gallery and full-screen course collections.
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const exploration = document.getElementById("course-exploration");
  const paths = document.getElementById("course-paths");
  const domainView = document.getElementById("course-domain-view");
  const main = document.getElementById("main-content");
  const sidebar = document.querySelector(".sidebar");
  const mobileTopbar = document.querySelector(".mobile-topbar");
  if (!paths || !domainView) return;

  const artwork = [
    "https://cdn.21st.dev/assets/mirror/21/21bf561c0452c2fae65a5c747aeba0996e6942fcb8eb3e628c50478f458065c5.jpg",
    "https://cdn.21st.dev/assets/mirror/7c/7c873d1af9cfb98c26de10dc98e807bcec8de8321936158d1b0e82c6b7f73d0c.jpg",
    "https://cdn.21st.dev/assets/mirror/35/350edca6de5b00194dbba8be86d6fc51f9192901ed127fd67855f369ff3bc9e5.jpg",
    "https://cdn.21st.dev/assets/mirror/dc/dc1338c2544ff95224a36bff0cd432e122417e6250bfd0ff82fbfceacfbf3283.jpg",
    "https://cdn.21st.dev/assets/mirror/ba/ba6557999b707efbaa73506debbc594e0703c071fdfc05951c9b355f0ad078e8.jpg",
    "https://cdn.21st.dev/assets/mirror/67/676c45dea273e8467aa434fbd08669408fe0a8b9151902e3ac39c7dc74cab416.jpg"
  ];
  const descriptions = {
    "All Courses": "Browse every course in one place, across all learning domains.",
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
  let currentDomain = null;
  let originatingCard = null;
  let originatingImage = null;
  let directEntry = false;
  let waitingForHistory = false;

  exploration.hidden = false;
  paths.setAttribute("aria-busy", "true");
  paths.innerHTML = Array.from({ length: 6 }, () => `<div class="course-domain-skeleton" aria-hidden="true"></div>`).join("");

  try{
    courses = await ICData.getCourses();
  }catch(err){
    renderGalleryMessage(`We couldn't load the course domains. ${err.message}`, true);
    return;
  }

  if (!courses.length){
    renderGalleryMessage("No courses are listed yet.");
    return;
  }

  const courseDomains = Array.from(new Set(courses.map(course => course.domain || "Uncategorized")))
    .filter(domain => domain.toLocaleLowerCase() !== "all courses");
  domains = ["All Courses", ...courseDomains];
  renderDomainTiles();

  const initialDomain = domainFromUrl();
  if (initialDomain){
    directEntry = true;
    history.replaceState({ ...(history.state || {}), courseDomain: true, domain: initialDomain }, "", location.href);
    openDomain(initialDomain, findDomainCard(initialDomain), { push: false, animate: false });
  }

  function renderGalleryMessage(message, isError = false){
    paths.removeAttribute("aria-busy");
    paths.innerHTML = `<p class="course-gallery-state${isError ? " is-error" : ""}" role="${isError ? "alert" : "status"}">${escapeHtml(message)}</p>`;
  }

  function renderDomainTiles(){
    paths.removeAttribute("aria-busy");
    paths.dataset.count = String(domains.length);
    paths.innerHTML = domains.map((domain, index) => {
      const count = domain === "All Courses"
        ? courses.length
        : courses.filter(course => (course.domain || "Uncategorized") === domain).length;
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

  function courseTiles(list){
    return list.map((course, index) => {
      const rating = course.rating ? course.rating.toFixed(1) : "Not rated";
      const duration = formatCourseDuration(course.duration) || "Duration not listed";
      const shape = list.length === 2 ? "square" : list.length === 1 || index % 2 === 1 ? "rectangle" : "square";
      return `
        <a class="course-path" data-shape="${shape}" href="${escapeHtml(course.link)}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(course.name)} course in a new tab. Rating ${rating}. ${escapeHtml(duration)}.">
          <span class="course-path__eyebrow">${escapeHtml(course.domain || "Uncategorized")}</span>
          <span class="course-path__title">${escapeHtml(course.name)}</span>
          <span class="course-path__detail">
            <span>Rating ${course.rating ? rating : "—"}</span>
            <span>Duration ${course.duration ? escapeHtml(duration) : "—"}</span>
          </span>
          <span class="course-path__arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join("");
  }

  function openDomain(domain, card, options = {}){
    const actualDomain = domains.find(item => item.toLocaleLowerCase() === String(domain || "").toLocaleLowerCase());
    if (!actualDomain) return;

    const image = card?.querySelector(".course-domain-card__image") || null;
    const imageSrc = image?.currentSrc || image?.src || artwork[domains.indexOf(actualDomain) % artwork.length];
    originatingCard = card || findDomainCard(actualDomain);
    originatingImage = originatingCard?.querySelector(".course-domain-card__image") || null;
    if (originatingImage) originatingImage.style.viewTransitionName = "course-domain-cover";

    const update = () => {
      currentDomain = actualDomain;
      domainView.classList.remove("is-entering", "is-leaving");
      const collection = actualDomain === "All Courses"
        ? courses
        : courses.filter(course => (course.domain || "Uncategorized") === actualDomain);
      const description = descriptions[actualDomain] || `Browse courses selected for ${actualDomain.toLocaleLowerCase()}.`;
      domainView.innerHTML = `
        <div class="course-domain-view__cover">
          <img class="course-domain-view__image" src="${imageSrc}" alt="" style="view-transition-name:course-domain-cover">
          <div class="course-domain-view__veil" aria-hidden="true"></div>
          <div class="course-domain-view__cover-content">
            <button class="course-domain-view__back" type="button" data-close-domain><span aria-hidden="true">←</span> All domains</button>
            <div class="course-domain-view__title-block">
              <span class="course-domain-view__eyebrow">${collection.length} ${collection.length === 1 ? "course" : "courses"}</span>
              <h1 id="course-domain-title">${escapeHtml(actualDomain)}</h1>
              <p>${escapeHtml(description)}</p>
            </div>
          </div>
        </div>
        <div class="course-domain-view__content">
          <p class="course-domain-view__collection-meta">${String(collection.length).padStart(2, "0")} ${collection.length === 1 ? "course" : "courses"}</p>
          <div class="course-paths course-course-grid" id="course-domain-courses" aria-label="${escapeHtml(actualDomain === "All Courses" ? "All courses" : `${actualDomain} courses`)}" data-count="${collection.length}">${collection.length ? courseTiles(collection) : `<p class="course-gallery-state">No courses are listed for this domain yet.</p>`}</div>
          <footer class="site-footer">
            <span>&copy; Internship Committee, IIM Rohtak</span>
            <span class="footer-built"><span>Built for IPM Students,</span><span style="font-weight:700;">By IPM Students</span></span>
          </footer>
        </div>
      `;
      const coverImage = domainView.querySelector(".course-domain-view__image");
      coverImage?.addEventListener("error", () => { coverImage.hidden = true; }, { once: true });
      domainView.hidden = false;
      main.inert = true;
      if (sidebar) sidebar.inert = true;
      if (mobileTopbar) mobileTopbar.inert = true;
      document.body.classList.add("course-domain-open");
      if (exploration) exploration.hidden = true;
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
      if (exploration) exploration.hidden = false;
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
    return Array.from(paths.querySelectorAll(".course-domain-card")).find(card => card.dataset.domain === domain) || null;
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
