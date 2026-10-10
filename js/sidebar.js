/* ============================================================
   IC Portal — Sidebar behaviour (shared across every page)
   - mobile drawer open/close
   - Knowledge Repository landing-page navigation
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
      el.setAttribute("aria-label", "Email the committee");
      const span = el.querySelector("span");
      if (span){
        // Prefer breaking right after the "@" so a long address wraps into
        // "name@" / "domain" instead of splitting a word in half.
        span.innerHTML = IC_CONFIG.committee.email.replace("@", "@<wbr>");
      }
    });
    document.querySelectorAll("[data-ic-linkedin]").forEach(el => {
      el.href = IC_CONFIG.committee.linkedin;
      el.setAttribute("aria-label", "IC on LinkedIn");
    });

    // Keep the contact shortcuts in the visible mobile masthead as well.
    const contactLinks = document.querySelector(".sidebar-footer");
    document.querySelectorAll(".mobile-contact-links").forEach(group => {
      ["[data-ic-email]", "[data-ic-linkedin]"].forEach(selector => {
        const source = contactLinks && contactLinks.querySelector(selector);
        if (!source) return;
        const iconLink = source.cloneNode(true);
        iconLink.setAttribute("aria-label", source.getAttribute("aria-label") || source.title);
        group.appendChild(iconLink);
      });
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
      const pageKey = page === "live-project" ? "live-projects" : (page === "courses" ? "knowledge" : page);
      let matchedLabel = "";
      document.querySelectorAll(`.sidebar .nav-link[data-page-key]`).forEach(link => {
        if (link.getAttribute("data-page-key") === pageKey){
          link.classList.add("is-active");
          link.setAttribute("aria-current", "page");
          const pageLabel = link.querySelector(".nav-label");
          if (pageLabel) matchedLabel = pageLabel.textContent.trim();
        }
      });
      const mobileIndicator = document.querySelector(".mobile-current-page");
      if (mobileIndicator){
        const fallbackLabels = { knowledge: "Knowledge Repository", "live-project": "Live Projects" };
        mobileIndicator.textContent = matchedLabel || fallbackLabels[page] || page.replace(/-/g, " ");
      }
    }

    // Escape closes mobile drawer
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  });
})();
