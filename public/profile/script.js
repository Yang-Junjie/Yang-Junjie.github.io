/* Progressive enhancement: every project and link works without JavaScript. */
(() => {
  const filters = document.querySelector("[data-project-filters]");
  const projects = [...document.querySelectorAll(".project[data-category]")];
  const status = document.getElementById("project-status");

  if (filters && projects.length) {
    const buttons = [...filters.querySelectorAll("button[data-filter]")];

    // An edited data file may not contain every category.
    for (const button of buttons) {
      const category = button.dataset.filter;
      button.hidden = category !== "all" && !projects.some(project => project.dataset.category === category);
      button.addEventListener("click", () => {
        let visibleCount = 0;
        for (const project of projects) {
          const visible = category === "all" || project.dataset.category === category;
          project.hidden = !visible;
          if (visible) visibleCount++;
        }
        for (const item of buttons) {
          item.setAttribute("aria-pressed", String(item === button));
        }
        if (status) status.textContent = `${button.textContent.trim()}：显示 ${visibleCount} 个项目`;
      });
    }
    filters.hidden = false;
  }

  const navLinks = [...document.querySelectorAll('.section-nav a[href^="#"]')];
  const sections = navLinks.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);

  if (sections.length) {
    let scheduled = false;
    const updateCurrentSection = () => {
      scheduled = false;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const readingLine = window.innerHeight * 0.35;
      const current = atBottom
        ? sections[sections.length - 1]
        : [...sections].reverse().find(section => section.getBoundingClientRect().top <= readingLine) || sections[0];
      for (const link of navLinks) {
        if (link.hash === `#${current.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    };
    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateCurrentSection);
    };
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    updateCurrentSection();
  }
})();
