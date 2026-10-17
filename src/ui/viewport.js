// Follow the actual space available beneath the browser's dynamic toolbars.
function fitViewport() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty(
    "--screen-height",
    `${Math.round(viewport?.height || window.innerHeight)}px`,
  );
  document.documentElement.style.setProperty(
    "--screen-top",
    `${Math.round(viewport?.offsetTop || 0)}px`,
  );
  window.dispatchEvent(new Event("layoutchange"));
}
window.addEventListener("resize", fitViewport);
window.visualViewport?.addEventListener("resize", fitViewport);
window.visualViewport?.addEventListener("scroll", fitViewport);
fitViewport();
