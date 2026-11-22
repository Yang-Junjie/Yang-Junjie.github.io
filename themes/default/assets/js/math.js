/* MD4C has already identified the math nodes; do not rescan text for delimiters. */
(() => {
  "use strict";
  if (!window.katex) return;
  document.querySelectorAll("[data-markdown] x-equation").forEach((node) => {
    if (node.closest("pre, code")) return;
    const source = node.textContent;
    try {
      window.katex.render(source, node, {
        displayMode: node.getAttribute("type") === "display",
        output: "htmlAndMathml",
        throwOnError: true,
        trust: false,
        maxExpand: 1000,
      });
      node.classList.add("math-rendered");
    } catch (error) {
      node.textContent = source;
      node.classList.add("math-error");
      node.title = error.message;
      console.warn("Math rendering failed:", error.message);
    }
  });
})();
