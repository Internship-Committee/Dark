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

  const artwork = {
    "All Courses": "assets/domain-all-courses-expanded.jpg",
    "Finance": "assets/domain-finance-expanded.jpg",
    "Marketing": "assets/domain-marketing-expanded.jpg",
    "Consulting": "assets/domain-consulting-expanded.jpg",
    "Entrepreneurship": "assets/domain-entrepreneurship-expanded.jpg",
    "Leadership": "assets/domain-leadership-expanded.jpg",
    "Data Analytics": "assets/domain-data-analytics-expanded.jpg",
    "Business Analytics": "assets/domain-business-analytics-expanded.jpg",
    "Operations Management": "assets/domain-operations-management-expanded.jpg"
  };
  const defaultArtwork = artwork["All Courses"];
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
  paths.innerHTML = Array.from({ length: 9 }, () => `<div class="course-domain-skeleton" aria-hidden="true"></div>`).join("");

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

  const courseDomains = Array.from(new Set(courses.map(courseDomain)))
    .filter(domain => domain.toLocaleLowerCase() !== "all courses")
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
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
    paths.innerHTML = domains.map(domain => {
      const image = artwork[domain] || defaultArtwork;
      return `
        <button class="course-domain-card" type="button" data-domain="${escapeHtml(domain)}" data-expanded-artwork="${image}" aria-label="Explore ${escapeHtml(domain)}">
          <img class="course-domain-card__image" src="${image}" alt="" loading="lazy" decoding="async">
          <span class="course-domain-card__shade" aria-hidden="true"></span>
          <span class="course-domain-card__content">
            <span class="course-domain-card__title" aria-hidden="true">
              <span class="course-domain-card__title-vertical">${escapeHtml(domain)}</span>
              <span class="course-domain-card__title-horizontal">${escapeHtml(domain)}</span>
            </span>
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

  function courseRows(list){
    return list.map((course, index) => {
      const rating = course.rating ? course.rating.toFixed(1) : "Not rated";
      const duration = formatCourseDuration(course.duration) || "Not listed";
      const href = String(course.link || "").trim();
      const wrapper = href ? "a" : "article";
      const linkAttributes = href
        ? `href="${escapeHtml(href)}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(course.name)} course in a new tab"`
        : "";
      return `
        <${wrapper} class="glass-card course-card" role="listitem" ${linkAttributes}>
          <span class="course-number">${String(index + 1).padStart(2, "0")}</span>
          <div class="course-name-cell">
            <span class="domain-tag">${escapeHtml(courseDomain(course))}</span>
            <h3>${escapeHtml(course.name)}</h3>
          </div>
          <div class="course-rating" data-label="Rating">${course.rating ? `<span class="rating">★ ${escapeHtml(rating)}</span>` : "—"}</div>
          <div class="course-duration" data-label="Duration">${course.duration ? escapeHtml(duration) : "—"}</div>
          ${href ? `<span class="card-link icon-link" aria-hidden="true" title="Open course">${ICIcons.externalLink}</span>` : ""}
        </${wrapper}>
      `;
    }).join("");
  }

  function openDomain(domain, card, options = {}){
    const actualDomain = domains.find(item => item.toLocaleLowerCase() === String(domain || "").toLocaleLowerCase());
    if (!actualDomain) return;

    const image = card?.querySelector(".course-domain-card__image") || null;
    const imageSrc = card?.dataset.expandedArtwork || artwork[actualDomain] || defaultArtwork || image?.currentSrc || image?.src;
    originatingCard = card || findDomainCard(actualDomain);
    originatingImage = image;
    if (originatingImage) originatingImage.style.viewTransitionName = "course-domain-cover";

    const update = () => {
      currentDomain = actualDomain;
      domainView.classList.remove("is-entering", "is-leaving");
      const collection = actualDomain === "All Courses"
        ? courses
        : courses.filter(course => courseDomain(course) === actualDomain);
      domainView.innerHTML = `
        <div class="course-domain-view__cover">
          <img class="course-domain-view__image" src="${imageSrc}" alt="" style="view-transition-name:course-domain-cover">
          <div class="course-domain-view__veil" aria-hidden="true"></div>
          <div class="course-domain-view__cover-content">
            <button class="course-domain-view__back" type="button" data-close-domain><span aria-hidden="true">←</span> All domains</button>
            <div class="course-domain-view__title-block">
              <h1 id="course-domain-title">${escapeHtml(actualDomain)}</h1>
            </div>
          </div>
        </div>
        <div class="course-domain-view__content">
          ${collection.length ? `
            <div class="course-list-heading editorial-list-heading">
              <span>No.</span><span>Course</span><span>Rating</span><span>Duration</span><span>Open</span>
            </div>
          ` : ""}
          <div class="course-domain-list" id="course-domain-courses" role="list" aria-label="${escapeHtml(actualDomain === "All Courses" ? "All courses" : `${actualDomain} courses`)}">${collection.length ? courseRows(collection) : `<p class="course-gallery-state">No courses are listed for this domain yet.</p>`}</div>
          <footer class="site-footer">
            <span class="footer-brand"><strong>Internship Committee</strong><span>IIM Rohtak</span></span>
            <span class="footer-built"><img class="footer-logo" src="assets/logo-footer.png" alt="Internship Committee logo"></span>
          </footer>
        </div>
      `;
      const coverImage = domainView.querySelector(".course-domain-view__image");
      coverImage?.addEventListener("error", () => { coverImage.hidden = true; }, { once: true });
      domainView.hidden = false;
      main.inert = true;
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
    const focusSelector = 'button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
    const headerFocusables = [];
    const mobileHeaderVisible = mobileTopbar && window.getComputedStyle(mobileTopbar).display !== "none";
    if (mobileHeaderVisible){
      headerFocusables.push(...mobileTopbar.querySelectorAll(focusSelector));
      if (sidebar && document.querySelector(".app-shell")?.classList.contains("nav-open")){
        headerFocusables.push(...sidebar.querySelectorAll(focusSelector));
      }
    }else if (sidebar){
      headerFocusables.push(...sidebar.querySelectorAll(focusSelector));
    }
    const focusable = [...new Set([...headerFocusables, ...domainView.querySelectorAll(focusSelector)])]
      .filter(element => element.getClientRects().length && !element.closest("[inert]"));
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

function courseDomain(course){
  return String(course?.domain || "").trim() || "Uncategorized";
}

function formatCourseDuration(duration){
  const value = String(duration || "").trim();
  if (!value) return "";
  if (/^\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?$/.test(value)) return `${value} hours`;
  return value.replace(/\bhrs?\b/gi, "hours");
}
