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
      el.title = IC_CONFIG.committee.email;
      const span = el.querySelector("span");
      if (span){
        // Prefer breaking right after the "@" so a long address wraps into
        // "name@" / "domain" instead of splitting a word in half.
        span.innerHTML = IC_CONFIG.committee.email.replace("@", "@<wbr>");
      }
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
      trigger.addEventListener("click", () => {
        // If the sidebar is collapsed to icons-only, expand it first so the
        // submenu labels are actually visible instead of toggling unseen.
        if (shell && shell.classList.contains("sidebar-collapsed")){
          setCollapsed(false);
          group.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
          return;
        }
        const isOpen = group.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(isOpen));
      });
    }

    // Desktop sidebar collapse / pin-open, with a hover preview while collapsed.
    // - Collapsed (pinned shut) is a persisted state, toggled only by clicking "<<".
    // - Hovering the sidebar while collapsed adds a temporary ".sidebar-preview"
    //   class that visually reopens it without touching the pinned state, so it
    //   snaps back to icon-only the moment the pointer leaves.
    // - Clicking "<<" while collapsed (including mid-preview) pins it open;
    //   clicking it while open collapses it again.
    const pinBtn = document.querySelector(".sidebar-pin-btn");
    const COLLAPSE_KEY = "ic-sidebar-collapsed";

    function setCollapsed(collapsed){
      if (!shell) return;
      shell.classList.toggle("sidebar-collapsed", collapsed);
      shell.classList.remove("sidebar-preview");
      if (pinBtn){
        pinBtn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
        pinBtn.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
      }
      try { localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch (e) { /* storage unavailable */ }
    }

    if (shell){
      let stored = null;
      try { stored = localStorage.getItem(COLLAPSE_KEY); } catch (e) { /* storage unavailable */ }
      if (stored === "1") setCollapsed(true);

      if (pinBtn){
        pinBtn.addEventListener("click", () => {
          setCollapsed(!shell.classList.contains("sidebar-collapsed"));
        });
      }

      const sidebarEl = shell.querySelector(".sidebar");
      if (sidebarEl){
        sidebarEl.addEventListener("mouseenter", () => {
          if (shell.classList.contains("sidebar-collapsed")) shell.classList.add("sidebar-preview");
        });
        sidebarEl.addEventListener("mouseleave", () => {
          shell.classList.remove("sidebar-preview");
        });
      }
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
