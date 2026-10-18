(() => {
  const intro = document.querySelector(".home-intro");
  if (!intro) return;

  const finish = () => {
    intro.classList.add("is-done");
    document.removeEventListener("keydown", onKeydown);
  };
  const onKeydown = event => {
    if (event.key === "Escape") finish();
  };

  intro.querySelector(".home-intro-skip")?.addEventListener("click", finish);
  document.addEventListener("keydown", onKeydown);
  window.setTimeout(finish, 7100);
})();
