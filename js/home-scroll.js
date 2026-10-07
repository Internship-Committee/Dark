(() => {
  const home = document.querySelector(".home-editorial");
  if (!home) return;

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = [...document.querySelectorAll("[data-scroll-reveal]")];

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  root.classList.add("home-scroll-ready");

  let current = 0;
  let target = 0;
  let frame = 0;

  function paintTitle(){
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.001) current = target;

    const progress = 0.22 + current * 0.78;
    home.style.setProperty("--title-hidden", `${(1 - progress) * 32}%`);
    home.style.setProperty("--title-opacity", `${0.18 + progress * 0.12}`);
    home.style.setProperty("--title-offset", `${(1 - progress) * 20}px`);

    if (current !== target) frame = requestAnimationFrame(paintTitle);
    else frame = 0;
  }

  function onScroll(){
    target = Math.min(1, Math.max(0, window.scrollY / Math.max(240, window.innerHeight * 0.34)));
    if (!frame) frame = requestAnimationFrame(paintTitle);
  }

  paintTitle();
  window.addEventListener("scroll", onScroll, {passive:true});
  window.addEventListener("resize", onScroll, {passive:true});

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {threshold:0.16, rootMargin:"0px 0px -10% 0px"});

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 4) * 85}ms`);
    observer.observe(item);
  });
})();
