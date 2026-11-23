const siteHeader = document.querySelector(".site-header");

if (siteHeader) {
  const topZone = 64;
  const scrollThreshold = 8;
  let previousY = Math.max(0, window.scrollY);

  window.addEventListener("scroll", () => {
    const currentY = Math.max(0, window.scrollY);

    if (currentY <= topZone) {
      siteHeader.classList.remove("is-retracted");
      previousY = currentY;
      return;
    }

    const distance = currentY - previousY;
    if (Math.abs(distance) >= scrollThreshold) {
      siteHeader.classList.toggle("is-retracted", distance > 0);
      previousY = currentY;
    }
  }, { passive: true });
}
