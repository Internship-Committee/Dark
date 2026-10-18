(() => {
  const intro = document.querySelector(".home-intro");
  const source = intro?.querySelector(".home-intro-reveal strong");
  const target = document.querySelector(".home-page-title");
  if (!intro || !source || !target) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let revealTimer = 0;
  let finished = false;
  let travelAnimation = null;
  let targetAnimation = null;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(revealTimer);
    travelAnimation?.cancel();
    targetAnimation?.cancel();
    document.documentElement.classList.remove("home-intro-active");
    intro.classList.add("is-done");
    document.removeEventListener("keydown", onKeydown);
    target.style.removeProperty("opacity");
    target.style.removeProperty("visibility");
  };

  const onKeydown = event => {
    if (event.key === "Escape") finish();
  };

  intro.querySelector(".home-intro-skip")?.addEventListener("click", finish);
  document.addEventListener("keydown", onKeydown);

  if (reducedMotion){
    finish();
    return;
  }

  document.documentElement.classList.add("home-intro-active");

  // The IC mark clears after one second. Let the title settle, then move
  // that exact title into the left-aligned home heading with a FLIP morph.
  revealTimer = window.setTimeout(() => {
    if (finished) return;

    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !from.height || !to.width || !to.height){
      finish();
      return;
    }

    const translateX = to.left - from.left;
    const translateY = to.top - from.top;
    const scaleX = to.width / from.width;
    const scaleY = to.height / from.height;
    target.style.visibility = "visible";
    target.style.opacity = "0";
    document.documentElement.classList.remove("home-intro-active");
    intro.classList.add("is-morphing");

    travelAnimation = source.animate([
      { transform: "translate3d(0, 0, 0) scale(1, 1)", opacity: 1 },
      { transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`, opacity: 0 }
    ], { duration: 920, easing: "cubic-bezier(.2,.75,.25,1)", fill: "forwards" });
    targetAnimation = target.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 720,
      delay: 180,
      easing: "ease-out",
      fill: "forwards"
    });

    travelAnimation.finished.then(finish, finish);
  }, 2580);
})();
