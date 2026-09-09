/* ============================================================
   Homepage — switches the Live Projects badge between
   "Applications open" (red pulse dot) and "Applications closed"
   (muted grey dot with a cross) based on whether any live
   projects currently exist.
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const badge = document.getElementById("home-live-badge");
  if (!badge) return;

  try{
    const projects = await ICData.getLiveProjects();
    if (!projects.length){
      badge.classList.add("is-closed");
      badge.innerHTML = `${ICIcons.closedDot} Applications closed`;
    }
  }catch(err){
    // Leave the default "Applications open" state on a fetch hiccup —
    // showing "closed" on a network error would be misleading.
  }
});
