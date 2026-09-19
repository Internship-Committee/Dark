/* ============================================================
   IC Portal — Sidebar behaviour (shared across every page)
   - mobile drawer open/close
   - Knowledge Repository dropdown
   - active link highlighting
   - injects committee email / LinkedIn / logo from config.js
   ============================================================ */

(function initSidebar(){
  document.addEventListener("DOMContentLoaded", () => {

    // Inject logo + committee links from central config
    document.querySelectorAll("[data-ic-logo]").forEach(el => { el.src = IC_CONFIG.logo; });
    document.querySelectorAll("[data-ic-email]").forEach(el => {
      el.href = `mailto:${IC_CONFIG.committee.email}`;
      el.querySelector("span") && (el.querySelector("span").textContent = IC_CONFIG.committee.email);
    });
    document.querySelectorAll("[data-ic-linkedin]").forEach(el => {
      el.href = IC_CONFIG.committee.linkedin;
    });

    // Mobile drawer
    const shell = document.querySelector(".app-shell");
    const menuBtn = document.querySelector(".menu-btn");
    const scrim = document.querySelector(".sidebar-scrim");
    const closeDrawer = () => shell && shell.classList.remove("nav-open");
    if (menuBtn && shell){
      menuBtn.addEventListener("click", () => shell.classList.toggle("nav-open"));
    }
    if (scrim){ scrim.addEventListener("click", closeDrawer); }
    document.querySelectorAll(".sidebar .nav-link").forEach(a => a.addEventListener("click", closeDrawer));

    // Knowledge Repository dropdown
    const group = document.querySelector(".nav-group");
    if (group){
      const trigger = group.querySelector(".nav-group-trigger");
      trigger.addEventListener("click", () => group.classList.toggle("is-open"));
    }

    // Active link highlighting based on body[data-page]
    const page = document.body.getAttribute("data-page");
    if (page){
      document.querySelectorAll(`.sidebar .nav-link[data-page-key]`).forEach(link => {
        if (link.getAttribute("data-page-key") === page){
          link.classList.add("is-active");
          const parentGroup = link.closest(".nav-group");
          if (parentGroup) parentGroup.classList.add("is-open");
        }
      });
    }

    // Escape closes mobile drawer
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  });
})();
