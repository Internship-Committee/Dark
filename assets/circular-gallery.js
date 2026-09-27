/* ============================================================
   IC Portal — Circular 3D gallery + hero scroll-jack
   ------------------------------------------------------------
   Hand-written vanilla JS (no React/build step — works straight
   from file://, GitHub Pages, anywhere). Ported from the original
   React "CircularGallery" component, plus:
     - hero → gallery morph: scrolling doesn't move the page,
       it smoothly crossfades the hero into the gallery instead.
     - unlimited rotation: once in the gallery, wheel/touch input
       just keeps spinning the ring (no min/max, never runs out).
     - "Continue exploring the site" releases the scroll-jack so
       the visitor can reach the footer normally.
   Depends on (loaded earlier in index.html): IC_CONFIG, ICData.
   ============================================================ */
(function () {
  "use strict";

  var stage = document.querySelector(".scrollstage");
  var root = document.getElementById("circular-gallery-root");
  if (!stage || !root) return; // this island only lives on the homepage

  var heroLayer = stage.querySelector("[data-stage-hero]");
  var galleryLayer = stage.querySelector("[data-stage-gallery]");
  var nudgeLink = stage.querySelector("[data-hero-nudge]");
  var fallback = stage.querySelector(".gallery-fallback");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Card content — mirrors the original React buildItems()
     --------------------------------------------------------- */
  function unsplash(id) {
    return "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=800&q=80";
  }

  var ICON = {
    rocket:
      '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 19 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-2.23 2-3c1.62-.87 4 0 4 0"/><path d="M12 15v5s2.23-.55 3-2c.87-1.62 0-4 0-4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/><path d="M4 19.5V6.5"/>',
    trophy:
      '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M17 5h3a4 4 0 0 1-4 4M7 5H4a4 4 0 0 0 4 4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6 6-2z"/>',
    code: '<path d="M8 9l-4 4 4 4M16 9l4 4-4 4"/>'
  };
  var ARROW = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  function iconSvg(name) {
    return (
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>"
    );
  }

  function exploreCta(label) {
    return '<span class="gallery-explore">' + label + " " + ARROW + "</span>";
  }

  function liveBadgeCta(open) {
    return (
      '<span class="gallery-live-badge' + (open ? "" : " is-closed") + '">' +
      '<span class="gallery-live-dot"></span>' +
      (open ? "Applications open" : "Applications closed") + " " + ARROW +
      "</span>"
    );
  }

  function buildItems(liveOpen) {
    return [
      {
        common: "Live Projects",
        binomial: "Active industry projects, with full role details on the site.",
        photoUrl: unsplash("1522071820081-009f0129c71c"),
        photoAlt: "A team collaborating around a table with laptops",
        photoPos: "50% 40%",
        href: "live-projects.html",
        icon: iconSvg("rocket"),
        cta: liveBadgeCta(liveOpen),
        liveCta: true
      },
      {
        common: "Course Repository",
        binomial: "Domain-wise learning resources with price, rating and a direct link.",
        photoUrl: unsplash("1481627834876-b7833e8f5570"),
        photoAlt: "A library with tall shelves full of books",
        photoPos: "50% 50%",
        href: "courses.html",
        icon: iconSvg("book"),
        cta: exploreCta("Explore")
      },
      {
        common: "Case Competitions",
        binomial: "Compete in analysing and solving real-world business problems.",
        photoUrl: unsplash("1552664730-d307ca884978"),
        photoAlt: "A group of people in a working meeting",
        photoPos: "50% 45%",
        href: "case-competitions.html",
        icon: iconSvg("trophy"),
        cta: exploreCta("View competitions")
      },
      {
        common: "Case Studies",
        binomial: "Written case studies from the IC research cell and student contributors.",
        photoUrl: unsplash("1454165804606-c3d57bc86b40"),
        photoAlt: "Desk with a laptop, charts and papers for business analysis",
        photoPos: "50% 50%",
        href: "case-studies.html",
        icon: iconSvg("file"),
        cta: exploreCta("Explore")
      },
      {
        common: "IIMR Student Resources",
        binomial: "Databases and tools students use, with login requirements made clear.",
        photoUrl: unsplash("1523240795612-9a054b0db644"),
        photoAlt: "Students talking together in a group",
        photoPos: "50% 40%",
        href: "iimr-resources.html",
        icon: iconSvg("compass"),
        cta: exploreCta("Explore")
      },
      {
        common: "GitHub Repositories",
        binomial: "A directory pointing to useful repositories, not a copy of them.",
        photoUrl: unsplash("1461749280684-dccba630e2f6"),
        photoAlt: "Source code on a computer monitor",
        photoPos: "50% 50%",
        href: "github-repositories.html",
        icon: iconSvg("code"),
        cta: exploreCta("Explore")
      }
    ];
  }

  /* ---------------------------------------------------------
     Build the ring DOM
     --------------------------------------------------------- */
  var fitEl = document.createElement("div");
  fitEl.className = "gallery-fit";

  var regionEl = document.createElement("div");
  regionEl.className = "gallery-region";
  regionEl.setAttribute("role", "region");
  regionEl.setAttribute("aria-label", "Circular 3D gallery of the portal's sections");
  regionEl.style.perspective = "2000px";

  var ringEl = document.createElement("div");
  ringEl.className = "gallery-ring";

  regionEl.appendChild(ringEl);
  fitEl.appendChild(regionEl);
  root.appendChild(fitEl);

  var items = buildItems(true);
  var cardEls = [];

  items.forEach(function (item) {
    var card = document.createElement("div");
    card.className = "gallery-card";
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", item.common);

    var inner = document.createElement("a");
    inner.className = "gallery-card-inner";
    inner.href = item.href;
    inner.innerHTML =
      '<img class="gallery-card-photo" src="' + item.photoUrl + '" alt="' + item.photoAlt + '" ' +
      'style="object-position:' + item.photoPos + '" draggable="false" loading="lazy" ' +
      "onerror=\"this.style.display='none'\">" +
      '<span class="gallery-card-icon">' + item.icon + "</span>" +
      '<div class="gallery-card-body">' +
      "<h2>" + item.common + "</h2>" +
      "<em>" + item.binomial + "</em>" +
      (item.cta || "") +
      "</div>";

    card.appendChild(inner);
    ringEl.appendChild(card);
    cardEls.push({ el: card, ctaSlot: item.liveCta ? inner : null });
  });

  var anglePerItem = 360 / items.length;

  function layoutCards(radius) {
    cardEls.forEach(function (c, i) {
      var angle = i * anglePerItem;
      c.el.style.transform = "rotateY(" + angle + "deg) translateZ(" + radius + "px)";
    });
  }

  /* ---------------------------------------------------------
     Fit-to-container scaling (cards are a fixed 300×400)
     --------------------------------------------------------- */
  var radius = 340;
  function computeScale() {
    var rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return 1;
    return Math.min(1, Math.max(0.6, Math.min(rect.width / 520, rect.height / 560)));
  }
  function applyFit() {
    var scale = computeScale();
    fitEl.style.transform = "scale(" + scale + ")";
    fitEl.style.transformOrigin = "50% 50%";
    radius = Math.round(340 + 90 * ((scale - 0.6) / 0.4));
    layoutCards(radius);
  }
  applyFit();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(applyFit).observe(root);
  } else {
    window.addEventListener("resize", applyFit);
  }

  /* ---------------------------------------------------------
     Rotation — auto-rotates gently, spins freely on input,
     never bounded (this is the "unlimited scroll" bit).
     --------------------------------------------------------- */
  var rotation = 0;
  var isInteracting = false;
  var interactionTimer = null;
  var autoRotateSpeed = reducedMotion ? 0 : 0.05;

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function (e) {
    autoRotateSpeed = e.matches ? 0 : 0.05;
  });

  function applyRotation() {
    ringEl.style.transform = "rotateY(" + rotation + "deg)";
    var total = ((rotation % 360) + 360) % 360;
    cardEls.forEach(function (c, i) {
      var itemAngle = i * anglePerItem;
      var relative = (itemAngle + total) % 360;
      var normalized = relative > 180 ? 360 - relative : relative;
      c.el.style.opacity = String(Math.max(0.3, 1 - normalized / 180));
    });
  }

  function tick() {
    if (!isInteracting) rotation += autoRotateSpeed;
    applyRotation();
    stepMorph();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function spin(deltaY) {
    isInteracting = true;
    rotation += deltaY * 0.15;
    applyRotation();
    clearTimeout(interactionTimer);
    interactionTimer = setTimeout(function () { isInteracting = false; }, 200);
  }

  /* ---------------------------------------------------------
     Live Projects status (defaults "open" until the data layer
     confirms there are none — same rule the old page used).
     --------------------------------------------------------- */
  (function checkLiveOpen() {
    try {
      if (typeof ICData === "undefined") return;
      ICData.getLiveProjects()
        .then(function (projects) {
          if (projects && projects.length) return;
          var liveCard = cardEls[0];
          if (liveCard && liveCard.ctaSlot) {
            var body = liveCard.ctaSlot.querySelector(".gallery-card-body");
            var old = body.querySelector(".gallery-live-badge");
            if (old) old.outerHTML = liveBadgeCta(false);
          }
        })
        .catch(function () { /* keep the "open" default on error */ });
    } catch (err) { /* keep the "open" default */ }
  })();

  /* ---------------------------------------------------------
     Hero ⇄ gallery morph + scroll-jack
     ------------------------------------------------------------
     Input sets a TARGET progress instantly; the visible progress
     eases toward that target a little every frame (see stepMorph,
     called from tick()). That easing — rather than snapping the
     DOM straight to whatever the wheel/touch event says — is what
     makes the hero fold into the gallery as one continuous move
     instead of a hard cut. Depth (scale) + a soft blur travel
     together with opacity so the two layers read as one shape
     dissolving into the other, not "old thing gone, new thing on".
     --------------------------------------------------------- */
  var MORPH_RANGE = 1200;   // total wheel/touch delta needed to fully morph — bigger = slower, more deliberate
  var MORPH_EASE = 0.09;    // how quickly the visible progress catches up to the target each frame — smaller = silkier
  var progressTarget = 0;   // 0 = hero shown, 1 = gallery shown (set instantly by input)
  var heroProgress = 0;     // eased value actually painted to the DOM
  var locked = !reducedMotion;

  function paintMorph(p) {
    // ease-in-out curve so the morph starts and settles gently rather than linearly
    var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

    var heroOpacity = Math.max(0, 1 - e * 1.35);
    var galleryOpacity = Math.min(1, Math.max(0, (e - 0.15) / 0.85));
    var blur = Math.sin(e * Math.PI) * 5; // rises then falls back to 0 at both ends of the morph

    heroLayer.style.opacity = String(heroOpacity);
    heroLayer.style.filter = "blur(" + (blur * e).toFixed(2) + "px)";
    heroLayer.style.transform = "scale(" + (1 + e * 0.12) + ") translateY(" + (e * -34) + "px)";
    heroLayer.style.pointerEvents = e > 0.5 ? "none" : "auto";
    heroLayer.setAttribute("aria-hidden", e > 0.5 ? "true" : "false");

    galleryLayer.style.opacity = String(galleryOpacity);
    galleryLayer.style.filter = "blur(" + (blur * (1 - e)).toFixed(2) + "px)";
    galleryLayer.style.transform = "scale(" + (1.1 - e * 0.1) + ")";
    galleryLayer.style.pointerEvents = e > 0.5 ? "auto" : "none";
    galleryLayer.setAttribute("aria-hidden", e > 0.5 ? "false" : "true");
  }

  function setHeroProgress(p) {
    progressTarget = Math.min(1, Math.max(0, p));
  }

  function stepMorph() {
    var diff = progressTarget - heroProgress;
    if (Math.abs(diff) < 0.0006) {
      if (heroProgress !== progressTarget) { heroProgress = progressTarget; paintMorph(heroProgress); }
      return;
    }
    heroProgress += diff * MORPH_EASE;
    paintMorph(heroProgress);
  }

  function lockStage() {
    locked = true;
    document.body.classList.add("stage-locked");
    stage.classList.add("is-locked");
  }
  function unlockStage() {
    if (!locked) return;
    locked = false;
    document.body.classList.remove("stage-locked");
    stage.classList.remove("is-locked");
    stage.classList.add("is-released");
  }

  function isOverSidebarChrome(target) {
    return !!(target && target.closest && target.closest(".sidebar, .mobile-topbar, .sidebar-scrim"));
  }

  // Once the gallery has fully settled in, scrolling down a bit further
  // (rather than clicking a button) releases the scroll-jack on its own —
  // the same downward gesture just keeps carrying the visitor forward.
  var RELEASE_THRESHOLD = 780;
  var releaseAccum = 0;

  function handleDelta(dy) {
    if (progressTarget < 1 || heroProgress < 0.985) {
      setHeroProgress(progressTarget + dy / MORPH_RANGE);
      releaseAccum = 0;
      return;
    }
    // Fully in the gallery: rotate freely, either direction, with no limit,
    // while also counting sustained downward scrolling toward release.
    spin(dy);
    releaseAccum = Math.max(0, Math.min(RELEASE_THRESHOLD, releaseAccum + dy));
    if (releaseAccum >= RELEASE_THRESHOLD) unlockStage();
  }

  document.addEventListener("wheel", function (e) {
    if (!locked || isOverSidebarChrome(e.target)) return;
    e.preventDefault();
    handleDelta(e.deltaY);
  }, { passive: false });

  var touchY = null;
  document.addEventListener("touchstart", function (e) {
    if (!locked || isOverSidebarChrome(e.target)) return;
    touchY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchmove", function (e) {
    if (!locked || touchY === null || isOverSidebarChrome(e.target)) return;
    e.preventDefault();
    var y = e.touches[0].clientY;
    handleDelta((touchY - y) * 1.6);
    touchY = y;
  }, { passive: false });

  document.addEventListener("touchend", function () { touchY = null; });

  if (nudgeLink) {
    nudgeLink.addEventListener("click", function (e) {
      e.preventDefault();
      if (locked) setHeroProgress(progressTarget + 0.4);
    });
  }

  /* ---------------------------------------------------------
     Go live
     --------------------------------------------------------- */
  stage.classList.add("is-enhanced");
  if (fallback) fallback.setAttribute("aria-hidden", "true");

  if (reducedMotion) {
    // Skip the scroll-jack for folks who asked for less motion: show the
    // gallery in place of the hero immediately, page scrolls normally.
    heroProgress = 1;
    progressTarget = 1;
    paintMorph(1);
  } else {
    heroProgress = 0;
    progressTarget = 0;
    paintMorph(0);
    lockStage();
  }
})();
