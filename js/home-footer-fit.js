(() => {
  const main = document.querySelector('body[data-page="home"] main.main');
  const footer = main?.querySelector("footer.site-footer");
  const content = main?.querySelector(".home-editorial");
  if (!main || !footer || !content) return;

  let frame = 0;
  const fitFooter = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      footer.style.setProperty("--home-footer-fit-gap", "0px");

      const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY;
      const viewport = window.visualViewport;
      const viewportBottom = window.scrollY + (viewport
        ? viewport.offsetTop + viewport.height
        : document.documentElement.clientHeight);
      const bottomPadding = parseFloat(getComputedStyle(main).paddingBottom) || 0;
      const gap = Math.max(0, viewportBottom - footerBottom - bottomPadding);

      footer.style.setProperty("--home-footer-fit-gap", `${Math.ceil(gap)}px`);
    });
  };

  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(fitFooter) : null;
  observer?.observe(content);
  observer?.observe(footer);

  window.addEventListener("resize", fitFooter, { passive: true });
  window.addEventListener("orientationchange", fitFooter, { passive: true });
  window.visualViewport?.addEventListener("resize", fitFooter, { passive: true });
  document.fonts?.ready.then(fitFooter);
  fitFooter();
})();
