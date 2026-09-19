/* ============================================================
   IC Portal — Homepage coverflow: an infinite, wheel/touch-driven
   3D card carousel (inspired by Active Theory's work page).

   Unlike a scroll-scrubbed carousel, this one is NOT tied to the
   document's scroll height — there's no "end" to run out of.
   While the section fills the viewport, wheel/touch/keyboard input
   is captured and mapped onto an endlessly wrapping virtual index
   (card 0 follows the last card, forever, in both directions).
   Scrolling with intent (a sustained push in one direction) hands
   control back to the normal page so people can still reach the
   footer below — or the hero above.
   ============================================================ */
(function(){
  var section = document.getElementById("coverflow");
  if (!section) return;

  var cards = Array.prototype.slice.call(section.querySelectorAll(".cf-card"));
  var logo  = document.getElementById("coverflowLogo");
  var dots  = Array.prototype.slice.call(document.querySelectorAll("#coverflowDots .cf-dot"));
  var hint  = section.querySelector(".coverflow-hint");
  var skip  = section.querySelector(".coverflow-skip");
  var N     = cards.length;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || N < 2){
    section.classList.add("cf-static");
    return; // plain stacked-list fallback, styled in css/coverflow.css
  }

  section.style.height = "100vh"; // fixed — no runway math, no "end"

  var SENS         = 0.0024;                 // wheel px -> virtual index units
  var TOUCH_SENS   = SENS * 2.4;
  var EASE         = 0.15;                   // per-frame lerp toward target (momentum feel)
  var EXIT_AFTER   = function(){ return window.innerHeight * 1.25; }; // sustained overscroll needed to break out
  var IDLE_RESET_MS= 260;

  var virtual = 0;     // current eased fractional index (unbounded, wraps visually)
  var target  = 0;     // target fractional index (unbounded)
  var locked  = false;
  var exitAccum = 0;
  var lastDir  = 0;
  var lastWheelAt = 0;
  var raf = null;
  var touchY = null;

  function wrap(i){
    var m = i % N;
    if (m < 0) m += N;
    return m;
  }

  // Shortest signed distance from the current position to card i, wrapping
  // around N — this is what makes the last card flow straight into the
  // first one instead of stopping.
  function circularOffset(i, v){
    var raw = (i - v) % N;
    if (raw > N / 2) raw -= N;
    if (raw < -N / 2) raw += N;
    return raw;
  }

  function spacingForWidth(){
    return window.innerWidth < 640 ? 150 : 292;
  }

  function render(){
    var spacing = spacingForWidth();
    var activeIndex = wrap(Math.round(virtual));
    dots.forEach(function(d, i){ d.classList.toggle("is-active", i === activeIndex); });

    cards.forEach(function(card, i){
      var offset  = circularOffset(i, virtual);
      var abs     = Math.abs(offset);
      var clamped = Math.min(abs, 3);
      var x    = offset * spacing;
      var rotY = Math.max(-64, Math.min(64, offset * -35));
      var scale= Math.max(0.56, 1 - clamped * 0.17);
      var z    = -clamped * 175;
      var y    = clamped * clamped * 7;      // gentle arc — cards rise as they recede
      var opacity = Math.max(0, 1 - clamped * 0.46);

      card.style.transform =
        "translate(-50%,-50%) translateX(" + x + "px) translateY(" + y + "px) " +
        "translateZ(" + z + "px) rotateY(" + rotY + "deg) scale(" + scale + ")";
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(1000 - Math.round(abs * 10));
      card.style.pointerEvents = abs < 2.4 ? "auto" : "none";
      card.classList.toggle("is-active", abs < 0.5);
    });

    if (logo){
      logo.style.transform = "translate(-50%,-50%) rotateY(" + (virtual * 68) + "deg)";
    }
  }

  function loop(){
    var delta = target - virtual;
    if (Math.abs(delta) < 0.0009){
      virtual = target;
    } else {
      virtual += delta * EASE;
    }
    render();
    if (Math.abs(target - virtual) > 0.0009 || locked){
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }

  function kick(){
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function sectionFillsViewport(){
    var rect = section.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.12 && rect.bottom >= window.innerHeight * 0.88;
  }

  function engageIfNeeded(){
    if (locked) return;
    if (sectionFillsViewport()){
      locked = true;
      exitAccum = 0;
      lastDir = 0;
      section.classList.add("cf-locked");
      kick();
    }
  }

  function disengage(directionSign){
    locked = false;
    section.classList.remove("cf-locked");
    // Hand off a nudge of native scroll so the page keeps moving the way
    // the person was already scrolling, instead of feeling stuck.
    window.scrollBy({ top: directionSign * 160, behavior: "auto" });
  }

  window.addEventListener("scroll", engageIfNeeded, { passive: true });
  window.addEventListener("resize", function(){ render(); });

  function bumpExit(dy){
    var now = performance.now();
    if (now - lastWheelAt > IDLE_RESET_MS) exitAccum = 0;
    lastWheelAt = now;

    var dir = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
    if (dir !== 0 && dir === lastDir){
      exitAccum += Math.abs(dy);
    } else {
      exitAccum = Math.abs(dy);
    }
    lastDir = dir;
    return dir;
  }

  function onWheel(e){
    if (!sectionFillsViewport()){
      if (locked){ locked = false; section.classList.remove("cf-locked"); }
      return;
    }
    if (!locked){
      engageIfNeeded();
      if (!locked) return;
    }
    e.preventDefault();

    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 18;
    else if (e.deltaMode === 2) dy *= window.innerHeight;

    target += dy * SENS;
    var dir = bumpExit(dy);

    if (exitAccum > EXIT_AFTER()){
      exitAccum = 0;
      disengage(dir);
      return;
    }
    if (hint) hint.style.opacity = "0";
    kick();
  }

  function onTouchStart(e){
    if (!sectionFillsViewport()) return;
    touchY = e.touches[0].clientY;
    engageIfNeeded();
  }

  function onTouchMove(e){
    if (!locked || touchY === null) return;
    var y = e.touches[0].clientY;
    var dy = touchY - y;
    touchY = y;
    e.preventDefault();

    target += dy * TOUCH_SENS;
    var dir = bumpExit(dy);

    if (exitAccum > EXIT_AFTER() * 0.6){
      exitAccum = 0;
      touchY = null;
      disengage(dir);
      return;
    }
    if (hint) hint.style.opacity = "0";
    kick();
  }

  function onTouchEnd(){ touchY = null; }

  function onKeydown(e){
    if (!locked) return;
    var dy = 0;
    if (e.key === "ArrowDown" || e.key === "PageDown") dy = 130;
    else if (e.key === "ArrowUp" || e.key === "PageUp") dy = -130;
    else return;
    e.preventDefault();
    target += dy * SENS;
    if (hint) hint.style.opacity = "0";
    kick();
  }

  section.addEventListener("wheel", onWheel, { passive: false });
  section.addEventListener("touchstart", onTouchStart, { passive: true });
  section.addEventListener("touchmove", onTouchMove, { passive: false });
  section.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKeydown);

  // Clicking the active card navigates normally (it's a real <a href>).
  // Clicking a side card instead eases it into the active position,
  // taking the shortest way around the loop.
  cards.forEach(function(card, i){
    card.addEventListener("click", function(e){
      if (!card.classList.contains("is-active")){
        e.preventDefault();
        target += circularOffset(i, virtual);
        kick();
      }
    });
  });

  if (skip){
    skip.addEventListener("click", function(){ disengage(1); });
  }

  engageIfNeeded();
  render();
})();
