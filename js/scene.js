/* ============================================================
   IC Portal — Homepage "scene" driver.
   One pinned 3D stage: marquee fades/flies out, a circular
   gallery ring of 6 cards takes over and orbits a central
   revolving logo. Rotation is set directly from scroll position
   while the user is scrolling; the moment scrolling pauses, a
   slow idle spin picks up from exactly where it left off — so
   the ring is always moving and never "ends" (closed loop).
   ============================================================ */
(function(){
  var scene = document.getElementById("scene");
  if (!scene) return;

  var cards   = Array.prototype.slice.call(scene.querySelectorAll(".cf-card"));
  var ringEl  = document.getElementById("sceneCards");
  var logo    = document.getElementById("sceneLogo");
  var marquee = document.getElementById("sceneMarquee");
  var hint    = document.getElementById("sceneHint");
  var dots    = Array.prototype.slice.call(document.querySelectorAll("#sceneDots .cf-dot"));
  var N       = cards.length;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || N === 0){
    scene.classList.add("sc-static");
    return; // plain stacked-list fallback, styled in css/scene.css
  }

  var ANGLE_STEP   = 360 / N;
  var TURNS_ACROSS_SECTION = 2;   // how many full loops scrolling through the section makes
  var IDLE_SPEED   = 0.035;       // deg per animation frame when idle
  var SCROLL_IDLE_DELAY = 150;    // ms after last scroll event before idle spin resumes
  var MARQUEE_FADE_END = 0.16;    // progress at which the marquee has fully dissolved
  var MARQUEE_FADE_START = 0.03;

  var rotation = 0;               // current ring rotation, degrees
  var isUserScrolling = false;
  var scrollIdleTimer = null;
  var rafId = null;
  var sceneInView = false;
  var lastProgress = 0;

  function setRunway(){
    scene.style.height = (TURNS_ACROSS_SECTION * N * 0.62 * window.innerHeight) + "px";
  }

  function radiusForWidth(){
    return window.innerWidth < 640 ? 150 : Math.min(420, window.innerWidth * 0.24);
  }

  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  function ringVisibilityFor(progress){
    return clamp((progress - MARQUEE_FADE_START) / (MARQUEE_FADE_END - MARQUEE_FADE_START), 0, 1);
  }

  function sectionProgress(){
    var rect = scene.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total > 0 ? (-rect.top) / total : 0;
    return clamp(p, 0, 1);
  }

  function renderRing(ringVisibility){
    var radius = radiusForWidth();
    var frontIndex = -1;
    var frontDist = 999;

    cards.forEach(function(card, i){
      var itemAngle = i * ANGLE_STEP;
      var world = ((itemAngle + rotation) % 360 + 360) % 360;
      var normalized = world > 180 ? 360 - world : world; // 0 = facing camera, 180 = facing away
      var dist = Math.abs(normalized);

      if (dist < frontDist){ frontDist = dist; frontIndex = i; }

      var scale = 0.62 + 0.5 * (1 - dist / 180);
      var opacity = clamp(1 - (dist / 180) * 0.62, 0.34, 1) * ringVisibility;

      // each card keeps a fixed slot on the ring; the ring wrapper
      // itself (below) is what actually spins
      card.style.transform =
        "translate(-50%,-50%) rotateY(" + itemAngle.toFixed(2) + "deg) translateZ(" + radius + "px) scale(" + scale.toFixed(3) + ")";
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(1000 - Math.round(dist));
    });

    ringEl.style.transform = "rotateY(" + rotation.toFixed(2) + "deg)";

    cards.forEach(function(card, i){
      var active = i === frontIndex;
      card.classList.toggle("is-active", active);
      card.style.pointerEvents = ringVisibility > 0.7 ? "auto" : "none";
    });
    dots.forEach(function(d, i){ d.classList.toggle("is-active", i === frontIndex); });
  }

  function renderMarquee(progress){
    var t = ringVisibilityFor(progress);
    var opacity = 1 - t;
    var scale = 1 + t * 0.55;
    var z = t * 420;
    marquee.style.opacity = opacity.toFixed(3);
    marquee.style.transform = "scale(" + scale.toFixed(3) + ") translateZ(" + z.toFixed(0) + "px)";
    marquee.style.pointerEvents = t > 0.6 ? "none" : "auto";
    if (hint) hint.style.opacity = progress > 0.04 ? "0" : "1";
  }

  function renderLogo(progress){
    // morphs from a small boxed "signature panel" (marquee phase) into
    // a large faint hub the ring orbits around, and keeps its own slow
    // independent revolve throughout the whole scene
    var t = ringVisibilityFor(progress);
    var size = 240 + t * (Math.min(520, window.innerWidth * 0.4) - 240);
    var img = logo.querySelector("img");
    logo.style.width = size + "px";
    logo.style.height = size + "px";
    logo.style.background = "linear-gradient(155deg, rgba(70,12,22," + (0.94 * (1 - t)) + "), rgba(12,3,5," + (0.94 * (1 - t)) + "))";
    logo.style.borderColor = "rgba(244,236,223," + (0.14 * (1 - t)) + ")";
    logo.style.boxShadow = "0 0 0 1px rgba(179,32,63," + (0.25 * (1 - t)) + ") inset, 0 30px 70px rgba(0,0,0," + (0.55 * (1 - t)) + "), 0 0 90px var(--sc-glow)";
    img.style.opacity = (1 - t * 0.86).toFixed(3);
    logo.style.transform = "translate(-50%,-50%) rotateY(" + (progress * 900).toFixed(2) + "deg)";
  }

  function render(){
    var progress = sectionProgress();
    lastProgress = progress;
    renderMarquee(progress);
    renderLogo(progress);
    renderRing(ringVisibilityFor(progress));
  }

  function onScroll(){
    isUserScrolling = true;
    rotation = sectionProgress() * TURNS_ACROSS_SECTION * 360;
    render();
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(function(){ isUserScrolling = false; }, SCROLL_IDLE_DELAY);
  }

  function idleLoop(){
    if (sceneInView){
      if (!isUserScrolling){
        rotation += IDLE_SPEED;
        renderRing(ringVisibilityFor(lastProgress));
      }
      rafId = window.requestAnimationFrame(idleLoop);
    } else {
      rafId = null;
    }
  }

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      sceneInView = entry.isIntersecting;
      if (sceneInView && rafId === null){
        rafId = window.requestAnimationFrame(idleLoop);
      }
    });
  }, { threshold: 0 });
  io.observe(scene);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function(){ setRunway(); render(); });

  // Clicking the front-facing card navigates normally (it's a real <a href>).
  // Clicking any other card instead spins the ring to bring it to the front.
  cards.forEach(function(card, i){
    card.addEventListener("click", function(e){
      if (!card.classList.contains("is-active")){
        e.preventDefault();
        var itemAngle = i * ANGLE_STEP;
        var current = ((itemAngle + rotation) % 360 + 360) % 360;
        var delta = current > 180 ? (360 - current) : -current;
        rotation += delta;
        render();
      }
    });
  });

  setRunway();
  render();
})();
