/* Lightweight image gallery plus spreadsheet-backed course collections. */
document.addEventListener("DOMContentLoaded", async () => {
  const exploration = document.getElementById("course-exploration");
  const gallery = document.getElementById("course-paths");
  const filters = document.getElementById("course-domain-filters");
  const domainView = document.getElementById("course-domain-view");
  const lightbox = document.getElementById("course-gallery-lightbox");
  const lightboxImage = document.getElementById("course-lightbox-image");
  const lightboxCaption = document.getElementById("course-lightbox-caption");
  const lightboxCount = document.getElementById("course-lightbox-count");
  const main = document.getElementById("main-content");
  const sidebar = document.querySelector(".sidebar");
  const appShell = document.querySelector(".app-shell");
  if (!gallery || !filters || !domainView) return;

  const galleryImages = [
    "https://cdn.21st.dev/assets/mirror/e8/e8173f9d3fc39d6c562c45ac058e5e57f43b4f6a0aa3783cd5cd5830d204160a.jpg",
    "https://cdn.21st.dev/assets/mirror/8e/8e6e1f07c0ab5d1ffceb6a04288a42eb918705f04e0aa7666bbc5bb662481ca0.jpg",
    "https://cdn.21st.dev/assets/mirror/3b/3b4d01c73cc20413c853be42695bc140acb4d2a32f6215f2e2bf61b60ebf440c.jpg",
    "https://cdn.21st.dev/assets/mirror/78/78b3e6f117be95793fb3d561ab909fbdecbbfcbfb9da026abaaa95c4cdf65a2f.jpg"
  ];
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
  const coursePageSize = 40;

  let courses = [];
  let domains = [];
  let currentDomain = null;
  let returnFocus = null;
  let directEntry = false;
  let waitingForHistory = false;
  let selectedImage = 0;
  let closeTimer = 0;

  exploration.hidden = false;
  gallery.setAttribute("aria-busy", "true");
  filters.innerHTML = '<p class="course-gallery-state" role="status">Loading courses…</p>';
  gallery.innerHTML = galleryImages.map((src, index) => `
    <button class="course-gallery-panel" type="button" data-image-index="${index}" aria-label="Open course gallery image ${index + 1}">
      <img src="${src}" alt="" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"${index === 0 ? ' fetchpriority="high"' : ""}>
      <span class="course-gallery-panel__shade" aria-hidden="true"></span>
      <span class="course-gallery-panel__number">${String(index + 1).padStart(2, "0")}</span>
      <span class="course-gallery-panel__open" aria-hidden="true">↗</span>
    </button>
  `).join("");
  gallery.addEventListener("click", event => {
    const panel = event.target.closest(".course-gallery-panel");
    if (panel) openImage(Number(panel.dataset.imageIndex), panel);
  });

  if (lightbox){
    lightbox.querySelector("[data-gallery-close]")?.addEventListener("click", () => lightbox.close());
    lightbox.querySelector("[data-gallery-previous]")?.addEventListener("click", () => moveImage(-1));
    lightbox.querySelector("[data-gallery-next]")?.addEventListener("click", () => moveImage(1));
    lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft"){ event.preventDefault(); moveImage(-1); }
      if (event.key === "ArrowRight"){ event.preventDefault(); moveImage(1); }
    });
    lightbox.addEventListener("close", () => returnFocus?.focus({ preventScroll: true }));
  }

  try{
    courses = await ICData.getCourses();
  }catch(error){
    gallery.removeAttribute("aria-busy");
    renderFilterMessage(`Course data could not be loaded. ${error.message}`, true);
    return;
  }
  gallery.removeAttribute("aria-busy");

  domains = ["All Courses", ...Array.from(new Set(courses.map(course => course.domain || "Uncategorized")))
    .filter(domain => domain.toLocaleLowerCase() !== "all courses")];
  renderDomainFilters();

  if (!courses.length){
    renderFilterMessage("No courses are listed yet.");
    return;
  }

  const initialDomain = domainFromUrl();
  if (initialDomain){
    directEntry = true;
    history.replaceState({ ...(history.state || {}), courseDomain: true, domain: initialDomain }, "", location.href);
    openDomain(initialDomain, findDomainButton(initialDomain), { push: false });
  }

  function renderFilterMessage(message, isError = false){
    filters.innerHTML = `<p class="course-gallery-state${isError ? " is-error" : ""}" role="${isError ? "alert" : "status"}">${escapeHtml(message)}</p>`;
  }

  function renderDomainFilters(){
    filters.innerHTML = domains.map(domain => {
      const count = domain === "All Courses"
        ? courses.length
        : courses.filter(course => (course.domain || "Uncategorized") === domain).length;
      return `<button class="course-domain-filter" type="button" data-domain="${escapeHtml(domain)}"><span>${escapeHtml(domain)}</span><span class="course-domain-filter__count">${String(count).padStart(2, "0")}</span></button>`;
    }).join("");
    filters.addEventListener("click", event => {
      const button = event.target.closest(".course-domain-filter");
      if (button) openDomain(button.dataset.domain, button);
    });
  }

  function openImage(index, trigger){
    if (!lightbox || !lightboxImage) return;
    selectedImage = (index + galleryImages.length) % galleryImages.length;
    returnFocus = trigger;
    updateLightbox();
    lightbox.showModal();
    lightbox.querySelector("[data-gallery-close]")?.focus({ preventScroll: true });
  }

  function moveImage(delta){
    selectedImage = (selectedImage + delta + galleryImages.length) % galleryImages.length;
    updateLightbox();
  }

  function updateLightbox(){
    lightboxImage.src = galleryImages[selectedImage];
    lightboxImage.alt = `Course repository image ${selectedImage + 1}`;
    lightboxCaption.textContent = `COURSE REPOSITORY / ${String(selectedImage + 1).padStart(2, "0")}`;
    lightboxCount.textContent = `${selectedImage + 1} / ${galleryImages.length}`;
  }

  function courseRows(list, startIndex = 0){
    return list.map((course, index) => {
      const href = safeHttpUrl(course.link);
      const wrapper = href ? "a" : "article";
      const linkAttributes = href
        ? `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(course.name)} course in a new tab"`
        : "";
      return `
        <${wrapper} class="glass-card course-card" role="listitem" ${linkAttributes}>
          <span class="course-number">${String(startIndex + index + 1).padStart(2, "0")}</span>
          <div class="course-name-cell">
            <span class="domain-tag">${escapeHtml(course.domain || "Uncategorized")}</span>
            <h3>${escapeHtml(course.name)}</h3>
          </div>
          <div class="course-rating" data-label="Rating">${course.rating ? `<span class="rating">★ ${escapeHtml(course.rating.toFixed(1))}</span>` : "—"}</div>
          <div class="course-duration" data-label="Duration">${course.duration ? escapeHtml(formatCourseDuration(course.duration)) : "—"}</div>
          ${href ? `<span class="card-link icon-link" aria-hidden="true" title="Open course">${ICIcons.externalLink}</span>` : ""}
        </${wrapper}>
      `;
    }).join("");
  }

  function openDomain(domain, trigger, options = {}){
    const actualDomain = domains.find(item => item.toLocaleLowerCase() === String(domain || "").toLocaleLowerCase());
    if (!actualDomain) return;
    window.clearTimeout(closeTimer);
    returnFocus = trigger || findDomainButton(actualDomain);
    currentDomain = actualDomain;

    const collection = actualDomain === "All Courses"
      ? courses
      : courses.filter(course => (course.domain || "Uncategorized") === actualDomain);
    const initialRows = collection.slice(0, coursePageSize);
    let displayedRows = initialRows.length;
    const imageSrc = artwork[actualDomain] || artwork["All Courses"];
    domainView.classList.remove("is-leaving");
    domainView.innerHTML = `
      <div class="course-domain-view__cover">
        <img class="course-domain-view__image" src="${imageSrc}" alt="" decoding="async">
        <div class="course-domain-view__veil" aria-hidden="true"></div>
        <div class="course-domain-view__cover-content">
          <button class="course-domain-view__back" type="button" data-close-domain><span aria-hidden="true">←</span> All domains</button>
          <div class="course-domain-view__title-block">
            <span class="course-domain-view__eyebrow">${collection.length} ${collection.length === 1 ? "course" : "courses"}</span>
            <h1 id="course-domain-title">${escapeHtml(actualDomain)}</h1>
          </div>
        </div>
      </div>
      <div class="course-domain-view__content">
        <p class="course-domain-view__collection-meta">${String(collection.length).padStart(2, "0")} ${collection.length === 1 ? "course" : "courses"}</p>
        ${collection.length ? `
          <div class="course-list-heading editorial-list-heading">
            <span>No.</span><span>Course</span><span>Rating</span><span>Duration</span><span>Open</span>
          </div>
        ` : ""}
        <div class="course-domain-list" id="course-domain-courses" role="list" aria-label="${escapeHtml(actualDomain === "All Courses" ? "All courses" : `${actualDomain} courses`)}" data-count="${collection.length}">${collection.length ? courseRows(initialRows) : `<p class="course-gallery-state">No courses are listed for this domain yet.</p>`}</div>
        ${collection.length > displayedRows ? `<button class="course-load-more" type="button" data-load-more>Show more courses <span aria-hidden="true">↘</span></button>` : ""}
        <footer class="site-footer">
          <span>&copy; Internship Committee, IIM Rohtak</span>
          <span class="footer-built"><img class="footer-logo" src="assets/logo-footer.png" alt="Internship Committee logo"></span>
        </footer>
      </div>
    `;
    domainView.hidden = false;
    domainView.classList.add("is-entering");
    main.inert = true;
    document.body.classList.add("course-domain-open");
    if (exploration) exploration.hidden = true;
    domainView.querySelector("[data-close-domain]")?.addEventListener("click", requestClose);
    domainView.querySelector("[data-load-more]")?.addEventListener("click", event => {
      const nextRows = collection.slice(displayedRows, displayedRows + coursePageSize);
      domainView.querySelector("#course-domain-courses")?.insertAdjacentHTML("beforeend", courseRows(nextRows, displayedRows));
      displayedRows += nextRows.length;
      if (displayedRows >= collection.length) event.currentTarget.remove();
    });
    domainView.querySelector("[data-close-domain]")?.focus({ preventScroll: true });

    if (options.push !== false){
      const url = new URL(location.href);
      url.searchParams.set("domain", actualDomain);
      history.pushState({ ...(history.state || {}), courseDomain: true, domain: actualDomain }, "", url);
      directEntry = false;
    }
  }

  function requestClose(){
    if (waitingForHistory || !currentDomain) return;
    if (directEntry){
      const url = new URL(location.href);
      url.searchParams.delete("domain");
      history.replaceState({ ...(history.state || {}), courseDomain: false }, "", url);
      directEntry = false;
      closeDomain();
    }else if (history.state?.courseDomain){
      waitingForHistory = true;
      history.back();
    }else{
      closeDomain();
    }
  }

  function closeDomain(){
    if (!currentDomain) return;
    domainView.classList.remove("is-entering");
    domainView.classList.add("is-leaving");
    closeTimer = window.setTimeout(() => {
      domainView.hidden = true;
      domainView.innerHTML = "";
      domainView.classList.remove("is-leaving");
      currentDomain = null;
      main.inert = false;
      document.body.classList.remove("course-domain-open");
      if (exploration) exploration.hidden = false;
      waitingForHistory = false;
      returnFocus?.focus({ preventScroll: true });
    }, 180);
  }

  function domainFromUrl(){
    const requested = new URL(location.href).searchParams.get("domain");
    return domains.find(domain => domain.toLocaleLowerCase() === String(requested || "").toLocaleLowerCase()) || null;
  }

  function findDomainButton(domain){
    return Array.from(filters.querySelectorAll(".course-domain-filter"))
      .find(button => button.dataset.domain === domain) || null;
  }

  window.addEventListener("popstate", () => {
    const requested = domainFromUrl();
    if (requested){
      waitingForHistory = false;
      directEntry = false;
      if (currentDomain !== requested) openDomain(requested, findDomainButton(requested), { push: false });
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
    const focusable = [...domainView.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
      .filter(element => element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first){ event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last){ event.preventDefault(); first.focus(); }
  });
});

function safeHttpUrl(value){
  try{
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  }catch(error){
    return "";
  }
}

function formatCourseDuration(duration){
  const value = String(duration || "").trim();
  if (!value) return "";
  if (/^\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?$/.test(value)) return `${value} hours`;
  return value.replace(/\bhrs?\b/gi, "hours");
}
