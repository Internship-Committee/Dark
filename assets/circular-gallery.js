/* ============================================================
   IC Portal — Circular 3D gallery + hero scroll-jack
   ------------------------------------------------------------
   Hand-written vanilla JS (no React/build step — works straight
   from file://, GitHub Pages, anywhere). Ported from an earlier
   React "CircularGallery" component + "useImmersiveScroll" hook:

     - endless, eased wheel / touch / keyboard scroll: the first
       stretch morphs the hero into the ring — which assembles out
       of the centre (radius, tilt and card scale all ease in
       together) rather than just crossfading — then every extra
       bit of scroll just keeps spinning the ring, forever, in
       either direction.
     - inertia on touch (a flick keeps the ring spinning after you
       lift your finger), a gentle idle drift once it settles and
       you stop scrolling, and Home / PageUp / PageDown / Arrow /
       Space keyboard support.
     - the whole thing is driven by writing a handful of CSS custom
       properties onto the stage element every frame (see
       css/home.css) instead of fighting the DOM directly, so it
       eases smoothly regardless of the display's frame rate.

   Depends on (loaded earlier in index.html): IC_CONFIG, ICData.
   ============================================================ */
(function () {
  "use strict";

  var stage = document.getElementById("home-stage");
  var root = document.getElementById("circular-gallery-root");
  if (!stage || !root) return; // this island only lives on the homepage

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return; // keep the plain, static fallback cards + normal page scroll

  /* ---------------------------------------------------------
     Card content — five destination sections
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
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6 6-2z"/>'
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
        binomial: "Courses, case studies, and student resources gathered in one place.",
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
    cardEls.push(card);
  });

  var anglePerItem = 360 / items.length;

  /* ---------------------------------------------------------
     Fit-to-container scaling (cards are a fixed 300×400)
     --------------------------------------------------------- */
  var baseRadius = 340;
  function computeScale() {
    var rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return 1;
    return Math.min(1, Math.max(0.6, Math.min(rect.width / 520, rect.height / 560)));
  }
  function applyFit() {
    var scale = computeScale();
    fitEl.style.transform = "scale(" + scale + ")";
    fitEl.style.transformOrigin = "50% 50%";
    baseRadius = Math.round(340 + 90 * ((scale - 0.6) / 0.4));
  }
  applyFit();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(applyFit).observe(root);
  } else {
    window.addEventListener("resize", applyFit);
  }

  /* ---------------------------------------------------------
     Paint the ring for a given rotation (deg) + intro (0→1).
     Ported from the original React CircularGallery's render math:
     the ring "assembles" out of the centre — radius, tilt and
     card scale all ease in together with intro — rather than the
     cards just crossfading in place.
     --------------------------------------------------------- */
  function paintRing(rotation, intro) {
    var t = intro < 0 ? 0 : intro > 1 ? 1 : intro;
    var ringRadius = baseRadius * (0.3 + 0.7 * t);
    var ringTilt = (1 - t) * 14;
    var cardScale = 0.75 + 0.25 * t;
    var introFade = Math.min(1, t * 1.6);

    ringEl.style.transform = "rotateX(" + ringTilt + "deg) rotateY(" + rotation + "deg)";

    var total = ((rotation % 360) + 360) % 360;
    cardEls.forEach(function (el, i) {
      var itemAngle = i * anglePerItem;
      var relative = (itemAngle + total) % 360;
      var normalized = relative > 180 ? 360 - relative : relative;
      var opacity = Math.max(0.3, 1 - normalized / 180) * introFade;
      el.style.transform =
        "rotateY(" + itemAngle + "deg) translateZ(" + ringRadius + "px) scale(" + cardScale + ")";
      el.style.opacity = String(opacity);
    });
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
          if (!liveCard) return;
          var body = liveCard.querySelector(".gallery-card-body");
          var old = body && body.querySelector(".gallery-live-badge");
          if (old) old.outerHTML = liveBadgeCta(false);
        })
        .catch(function () { /* keep the "open" default on error */ });
    } catch (err) { /* keep the "open" default */ }
  })();

  /* ---------------------------------------------------------
     Endless, page-pinning scroll for the home page.
     ------------------------------------------------------------
     The page itself never scrolls. Instead this listens to the
     wheel / touch / keyboard, accumulates the input into one
     "virtual scroll" distance and eases towards it:

       0 ─────────── morphDist ───────────────────────────────▶ ∞
       hero  ──morph──▶  gallery ring …keeps spinning as long as
                          you keep scrolling

      - First `morphDist` px: the hero fades out while the ring
        assembles around the centre (CSS variables on the stage).
      - After that: every extra px just rotates the ring — there
        is no end.
      - Scrolling back up rewinds the morph, so the hero returns.
     --------------------------------------------------------- */
  var clamp01 = function (n) { return n < 0 ? 0 : n > 1 ? 1 : n; };
  var smooth = function (n) { var x = clamp01(n); return x * x * (3 - 2 * x); }; // smoothstep
  var easeInOut = function (n) { return n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2; };

  var degPerPx = 0.18;      // ring turn per px of scroll — 0.18 → one full turn every 2000px
  var introSpin = 150;      // extra spin (deg) the ring "unwinds" while it morphs in
  var driftDegPerSec = 3;   // slow idle drift once settled and you've stopped scrolling

  function getMorphDist() {
    return Math.min(900, Math.max(520, window.innerHeight * 0.85));
  }
  var morphDist = getMorphDist();

  var target = 0;    // where the input says we should be (px)
  var current = 0;   // eased value actually shown (px)
  var inertia = 0;   // touch fling velocity (px/ms)
  var driftDeg = 0;
  var lastInput = -Infinity;
  var tween = null;  // { from, to, t0, dur }

  var touching = false;
  var dragDist = 0;
  var tx = 0, ty = 0, tLast = 0;

  var last = performance.now();
  var raf = 0;
  var prevRotation = Infinity, prevIntro = Infinity;
  var cssCache = {};

  function setVar(name, value) {
    var v = value.toFixed(4);
    if (cssCache[name] !== v) {
      cssCache[name] = v;
      stage.style.setProperty(name, v);
    }
  }

  function push(d) {
    tween = null;
    target = Math.max(0, target + d);
    lastInput = performance.now();
  }

  function animateTo(to, dur) {
    tween = { from: target, to: to, t0: performance.now(), dur: dur };
  }

  // Jump back to the hero. Whole ring-turns of accumulated spin are dropped
  // invisibly first (a full turn looks identical), so the rewind is never
  // longer than one turn.
  function goHome() {
    var wrapPx = 360 / degPerPx;
    var excess = Math.floor(Math.max(0, current - morphDist) / wrapPx) * wrapPx;
    current -= excess;
    target = Math.max(0, target - excess);
    animateTo(0, 1100);
  }

  /* ----------------------------- input ----------------------------- */
  function inSidebar(el) {
    return !!(el && el.closest && el.closest(".sidebar, .mobile-topbar, .sidebar-scrim"));
  }

  function onWheel(e) {
    if (e.ctrlKey || inSidebar(e.target)) return; // pinch-zoom / sidebar's own scrolling
    e.preventDefault();
    var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    // Vertical scroll spins the ring forwards; a sideways trackpad swipe spins it with your fingers.
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : e.deltaY;
    push(Math.max(-400, Math.min(400, d * unit)));
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    touching = true;
    dragDist = 0;
    inertia = 0;
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
    tLast = e.timeStamp;
  }
  function onTouchMove(e) {
    if (!touching || e.touches.length !== 1) return;
    e.preventDefault();
    var x = e.touches[0].clientX;
    var y = e.touches[0].clientY;
    var dx = x - tx;
    var dy = y - ty;
    tx = x; ty = y;
    // finger up = scroll down; finger sideways drags the ring with it
    var d = (Math.abs(dx) > Math.abs(dy) ? dx : -dy) * 1.5;
    dragDist += Math.abs(dx) + Math.abs(dy);
    var dt = Math.max(1, e.timeStamp - tLast);
    tLast = e.timeStamp;
    inertia = d / dt;
    push(d);
  }
  function onTouchEnd() {
    touching = false;
    inertia = Math.max(-2.5, Math.min(2.5, inertia)); // px/ms, keeps flings sane
  }
  // A drag that started on a card must not count as a click on it
  function onClickCapture(e) {
    if (dragDist > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
    dragDist = 0;
  }

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (inSidebar(t)) return;
    var page = window.innerHeight * 0.8;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        push(140);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        push(-140);
        break;
      case "PageDown":
        push(page);
        break;
      case "PageUp":
        push(-page);
        break;
      case " ":
        if (t && /^(A|BUTTON)$/.test(t.tagName)) return; // let Space activate focused controls
        push(e.shiftKey ? -page : page);
        break;
      case "Home":
        goHome();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  var cue = stage.querySelector(".hero-scroll-cue");
  function onCue(e) {
    e.preventDefault();
    animateTo(morphDist, 1300);
  }
  function onResize() {
    morphDist = getMorphDist();
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  stage.addEventListener("touchstart", onTouchStart, { passive: true });
  stage.addEventListener("touchmove", onTouchMove, { passive: false });
  stage.addEventListener("touchend", onTouchEnd);
  stage.addEventListener("touchcancel", onTouchEnd);
  stage.addEventListener("click", onClickCapture, true);
  if (cue) cue.addEventListener("click", onCue);

  /* ------------------------------ loop ----------------------------- */
  function tick(now) {
    var dt = Math.min(64, now - last);
    last = now;

    if (tween) {
      var k = clamp01((now - tween.t0) / tween.dur);
      target = tween.from + (tween.to - tween.from) * easeInOut(k);
      lastInput = now;
      if (k >= 1) tween = null;
    }
    if (!touching && Math.abs(inertia) > 0.004) {
      target = Math.max(0, target + inertia * dt);
      inertia *= Math.exp(-dt / 320);
      lastInput = now;
    }

    // ease the shown position towards the target (frame-rate independent)
    current += (target - current) * (1 - Math.exp(-dt / 110));
    if (Math.abs(target - current) < 0.05) current = target;

    var m = clamp01(current / morphDist);
    var intro = smooth(m);

    // slow idle drift once the ring is fully out and the user has stopped scrolling
    if (m > 0.85 && now - lastInput > 200) {
      driftDeg += ((driftDegPerSec * dt) / 1000) * smooth((m - 0.85) / 0.15);
    }

    var spin = Math.max(0, current - morphDist) * degPerPx; // endless part
    var rotation = spin - (1 - intro) * introSpin + driftDeg;

    // hero layer + heading, driven from CSS
    setVar("--m", m);
    setVar("--hero-out", smooth(m / 0.55));
    setVar("--cue-out", smooth(m / 0.18));
    setVar("--gal-in", smooth((m - 0.12) / 0.88));
    setVar("--head-in", smooth((m - 0.55) / 0.45));
    stage.classList.toggle("at-hero", current < 0.5);
    stage.classList.toggle("is-live", m > 0.55);

    if (Math.abs(rotation - prevRotation) > 0.004 || Math.abs(intro - prevIntro) > 0.0005) {
      prevRotation = rotation;
      prevIntro = intro;
      paintRing(rotation, intro);
    }

    raf = requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Go live
     --------------------------------------------------------- */
  paintRing(-introSpin, 0);
  stage.classList.add("is-enhanced", "at-hero");
  document.documentElement.classList.add("home-immersive");
  raf = requestAnimationFrame(tick);
})();
