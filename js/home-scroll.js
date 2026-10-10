(() => {
  const home = document.querySelector(".home-editorial");
  if (!home) return;

  const revealItems = [...document.querySelectorAll("[data-scroll-reveal]")];
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  document.documentElement.classList.add("home-scroll-ready");
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
