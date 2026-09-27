/* ============================================================
   IC Portal — Home page experience
   ------------------------------------------------------------
   Plain JS + CSS, no build step (no React / no esbuild needed).

   Renders the circular 3D gallery straight into #circular-gallery-root,
   and — unless the visitor has asked for reduced motion — takes over
   scrolling on the hero + gallery section:

     1. The very first bit of scroll/swipe doesn't move the page at
        all. Instead it smoothly cross-fades the hero into the
        gallery ("morph"), driven 1:1 by how much the visitor has
        scrolled so far.
     2. Once fully morphed in, further scrolling just spins the ring.
        That rotation has no limit in either direction — it is driven
        directly by scroll input, not by how much of the page is left
        to scroll through, so it never "runs out".
     3. Scrolling back up unwinds the ring, and once it's back to
        where you entered, keeps going and un-morphs back to the hero.
     4. Two small buttons (shown once you've engaged at all) let you
        jump back to the hero, or release the pin and continue down
        to the rest of the page.

   With JS disabled, or with prefers-reduced-motion set, none of this
   runs — the page stays a normal, two-section scrollable layout with
   the plain fallback cards (already in the HTML) in place of the ring.
   ============================================================ */

(function () {
  "use strict";

  const root = document.getElementById("circular-gallery-root");
  const experience = document.getElementById("home-experience");
  if (!root || !experience) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return; // leave the plain fallback cards + normal scrolling in place

  /* ------------------------------------------------------------
     Gallery content — mirrors the six portal sections.
     ------------------------------------------------------------ */
  const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

  const ICONS = {
    rocket:
      '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 19 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-2.23 2-3c1.62-.87 4 0 4 0"/><path d="M12 15v5s2.23-.55 3-2c.87-1.62 0-4 0-4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/><path d="M4 19.5V6.5"/>',
    trophy:
      '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M17 5h3a4 4 0 0 1-4 4M7 5H4a4 4 0 0 0 4 4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6 6-2z"/>',
    code: '<path d="M8 9l-4 4 4 4M16 9l4 4-4 4"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  };
  const svg = (paths, size) =>
    `<svg viewBox="0 0 24 24" width="${size || 20}" height="${size || 20}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  function buildItems(liveOpen) {
    const explore = (label) => `${label || "Explore"} ${svg(ICONS.arrow, 14)}`;
    const liveBadge = (open) =>
      `<span class="gallery-live-badge${open ? "" : " is-closed"}"><span class="gallery-live-dot"></span>${
        open ? "Applications open" : "Applications closed"
      } ${svg(ICONS.arrow, 14)}</span>`;

    return [
      {
        title: "Live Projects",
        desc: "Active industry projects, with full role details on the site.",
        photo: unsplash("1522071820081-009f0129c71c"),
        pos: "50% 40%",
        href: "live-projects.html",
        icon: ICONS.rocket,
        cta: liveBadge(liveOpen),
      },
      {
        title: "Course Repository",
        desc: "Domain-wise learning resources with price, rating and a direct link.",
        photo: unsplash("1481627834876-b7833e8f5570"),
        pos: "50% 50%",
        href: "courses.html",
        icon: ICONS.book,
        cta: explore(),
      },
      {
        title: "Case Competitions",
        desc: "Compete in analysing and solving real-world business problems.",
        photo: unsplash("1552664730-d307ca884978"),
        pos: "50% 45%",
        href: "case-competitions.html",
        icon: ICONS.trophy,
        cta: explore("View competitions"),
      },
      {
        title: "Case Studies",
        desc: "Written case studies from the IC research cell and student contributors.",
        photo: unsplash("1454165804606-c3d57bc86b40"),
        pos: "50% 50%",
        href: "case-studies.html",
        icon: ICONS.file,
        cta: explore(),
      },
      {
        title: "IIMR Student Resources",
        desc: "Databases and tools students use, with login requirements made clear.",
        photo: unsplash("1523240795612-9a054b0db644"),
        pos: "50% 40%",
        href: "iimr-resources.html",
        icon: ICONS.compass,
        cta: explore(),
      },
      {
        title: "GitHub Repositories",
        desc: "A directory pointing to useful repositories, not a copy of them.",
        photo: unsplash("1461749280684-dccba630e2f6"),
        pos: "50% 50%",
        href: "github-repositories.html",
        icon: ICONS.code,
        cta: explore(),
      },
    ];
  }

  /* ------------------------------------------------------------
     Render the ring
     ------------------------------------------------------------ */
  root.innerHTML =
    '<div class="vgallery-inner"><div class="vgallery-ringwrap"><div class="vgallery-ring" role="region" aria-label="Circular gallery of portal sections"></div></div></div>';
  const ring = root.querySelector(".vgallery-ring");

  let liveOpen = true;
  let items = buildItems(liveOpen);
  let cardEls = [];

  function renderCards() {
    ring.innerHTML = "";
    cardEls = items.map((item) => {
      const a = document.createElement("a");
      a.className = "vgallery-card";
      a.href = item.href;
      a.setAttribute("aria-label", `${item.title} — ${item.desc}`);
      a.innerHTML =
        `<img src="${item.photo}" alt="" draggable="false" style="object-position:${item.pos || "center"}" onerror="this.style.display='none'">` +
        `<span class="vgallery-icon">${svg(item.icon, 20)}</span>` +
        `<div class="vgallery-overlay"><h3>${item.title}</h3><p>${item.desc}</p><div class="vgallery-cta">${item.cta}</div></div>`;
      ring.appendChild(a);
      return a;
    });
  }
  renderCards();

  // Refresh the "Live Projects" card once we know whether applications are open —
  // defaults to open so a network hiccup never shows a misleading "closed".
  try {
    if (typeof ICData !== "undefined" && ICData.getLiveProjects) {
      ICData.getLiveProjects()
        .then((projects) => {
          if (projects && projects.length) return;
          liveOpen = false;
          items = buildItems(liveOpen);
          renderCards();
          layout();
        })
        .catch(function () {});
    }
  } catch (e) {}

  /* ------------------------------------------------------------
     Fit-scale: the ring's cards are a fixed 300×400px, shrink the
     whole ring to fit smaller stages (mirrors the old React hook).
     ------------------------------------------------------------ */
  let scale = 1;
  let radius = 600;
  function computeScale() {
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    scale = Math.min(1, Math.max(0.6, Math.min(rect.width / 520, rect.height / 560)));
    radius = Math.round(340 + 90 * ((scale - 0.6) / 0.4));
    ring.style.transform = `scale(${scale})`;
  }
  const ro = new ResizeObserver(computeScale);
  ro.observe(root);
  computeScale();

  /* ------------------------------------------------------------
     Rotation — unbounded. Auto-drifts slowly when idle, spins
     directly from scroll/touch input the rest of the time.
     ------------------------------------------------------------ */
  let rotation = 0;
  let lastInputAt = 0;
  const AUTO_SPEED = 0.045; // deg per frame when idle

  function layout() {
    const angleStep = 360 / cardEls.length;
    const norm = ((rotation % 360) + 360) % 360;
    cardEls.forEach((el, i) => {
      const itemAngle = i * angleStep;
      const relative = (itemAngle + norm) % 360;
      const distance = relative > 180 ? 360 - relative : relative;
      const opacity = Math.max(0.3, 1 - distance / 180);
      el.style.transform = `rotateY(${itemAngle}deg) translateZ(${radius}px)`;
      el.style.opacity = String(opacity);
    });
    ring.style.transform = `scale(${scale}) rotateY(${rotation}deg)`;
  }

  /* ------------------------------------------------------------
     Hero ⇄ gallery morph + infinite-rotate state machine
     ------------------------------------------------------------ */
  const backBtn = experience.querySelector(".experience-btn--back");
  const continueBtn = experience.querySelector(".experience-btn--continue");
  const scrollCue = document.getElementById("hero-scroll-cue");

  let engage = 0; // 0 = hero, 1 = fully in gallery
  let rotationSinceEnter = 0; // net rotation travelled since engage last reached 1
  let released = false; // true once "Continue" has handed scrolling back to the page
  let tweenId = null;

  const MORPH_RANGE = 640; // px-equivalent of wheel/touch delta to complete the morph
  const ROTATE_SENSITIVITY = 0.5; // degrees per px of wheel/touch delta
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function setEngage(v) {
    engage = clamp(v, 0, 1);
    experience.style.setProperty("--engage", String(engage));
    experience.classList.toggle("at-hero", engage <= 0);
    experience.classList.toggle("at-gallery", engage >= 1);
  }

  function lockScroll() {
    document.documentElement.classList.add("ic-scroll-lock");
  }
  function unlockScroll() {
    document.documentElement.classList.remove("ic-scroll-lock");
  }

  function applyDelta(delta) {
    if (released) return;
    lastInputAt = performance.now();
    if (engage < 1) {
      setEngage(engage + delta / MORPH_RANGE);
      if (engage >= 1) rotationSinceEnter = 0;
      return;
    }
    // Fully engaged: scrolling up first unwinds back to the point we entered,
    // then (once that's used up) reverses the morph back to the hero.
    if (delta < 0 && rotationSinceEnter <= 0) {
      setEngage(engage + delta / MORPH_RANGE);
      return;
    }
    rotation += delta * ROTATE_SENSITIVITY;
    rotationSinceEnter += delta * ROTATE_SENSITIVITY;
    // Keep the stored angle small forever — harmless, since only rotation % 360
    // is ever rendered, so this never causes a visible jump.
    if (rotation > 36000 || rotation < -36000) rotation %= 360;
  }

  function tweenEngageTo(target, ms) {
    if (tweenId) cancelAnimationFrame(tweenId);
    const start = engage;
    const t0 = performance.now();
    (function step(now) {
      const p = clamp((now - t0) / ms, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setEngage(start + (target - start) * eased);
      if (target >= 1) rotationSinceEnter = 0;
      if (p < 1) tweenId = requestAnimationFrame(step);
      else tweenId = null;
    })(t0);
  }

  function releaseToFooter() {
    released = true;
    unlockScroll();
    const rect = experience.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.height, behavior: "smooth" });
  }

  function backToIntro() {
    tweenEngageTo(0, 550);
  }

  // Wheel / touch / keyboard input, only while locked.
  function onWheel(e) {
    if (released) return;
    e.preventDefault();
    applyDelta(e.deltaY);
  }
  let touchY = null;
  function onTouchStart(e) {
    if (released || !e.touches.length) return;
    touchY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (released || touchY === null || !e.touches.length) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    applyDelta(touchY - y);
    touchY = y;
  }
  const INTERACTIVE_TAGS = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"];
  function onKeydown(e) {
    if (released) return;
    const el = e.target;
    if (el && (INTERACTIVE_TAGS.indexOf(el.tagName) !== -1 || el.isContentEditable)) return;
    const forward = ["ArrowDown", "PageDown", " ", "Spacebar"];
    const backward = ["ArrowUp", "PageUp"];
    if (forward.indexOf(e.key) !== -1) {
      e.preventDefault();
      applyDelta(90);
    } else if (backward.indexOf(e.key) !== -1) {
      e.preventDefault();
      applyDelta(-90);
    } else if (e.key === "Home") {
      e.preventDefault();
      backToIntro();
    }
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("resize", computeScale);

  if (scrollCue) {
    scrollCue.addEventListener("click", (e) => {
      e.preventDefault();
      tweenEngageTo(1, 700);
    });
  }
  if (backBtn) backBtn.addEventListener("click", backToIntro);
  if (continueBtn) continueBtn.addEventListener("click", releaseToFooter);

  // Kick things off. (#circular-gallery-root is display:none until "is-locked"
  // is added, so re-measure right after — the ResizeObserver would also catch
  // this on its own, but doing it eagerly avoids a one-frame flash at scale 1.)
  lockScroll();
  experience.classList.add("is-locked");
  setEngage(0);
  computeScale();

  (function frame() {
    if (!released && engage >= 1 && performance.now() - lastInputAt > 150) {
      rotation += AUTO_SPEED;
    }
    layout();
    requestAnimationFrame(frame);
  })();
})();
