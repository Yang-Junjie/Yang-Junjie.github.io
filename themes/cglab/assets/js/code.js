/* Theme enhancement: explicit language highlighting and accessible plain-text copying. */
(() => {
  "use strict";
  const settings = document.currentScript.dataset;
  const highlight = settings.highlight === "true";
  const copy = settings.copy === "true" && !!navigator.clipboard?.writeText;
  const labels = document.documentElement.lang.toLowerCase().startsWith("zh")
    ? { copy: "复制代码", copied: "已复制", failed: "复制失败", help: "复制失败，请手动选择代码" }
    : { copy: "Copy code", copied: "Copied", failed: "Copy failed", help: "Copy failed; select the code manually" };

  document.querySelectorAll("[data-markdown] pre > code").forEach((code) => {
    const source = code.textContent;
    const language = [...code.classList].find((name) => name.startsWith("language-"))?.slice(9);
    if (highlight && language && window.hljs?.getLanguage(language)) {
      try {
        code.innerHTML = window.hljs.highlight(source, { language, ignoreIllegals: true }).value;
        code.classList.add("hljs");
      } catch (error) {
        console.warn("Code highlighting failed:", error);
      }
    }
    const pre = code.parentElement;
    pre.tabIndex = 0;
    if (!copy) return;
    const block = document.createElement("div");
    block.className = "code-block";
    const toolbar = document.createElement("div");
    toolbar.className = "code-toolbar";
    if (language) {
      const label = document.createElement("span");
      label.className = "code-language";
      label.textContent = language;
      toolbar.append(label);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = labels.copy;
    button.setAttribute("aria-label", labels.copy);
    const status = document.createElement("span");
    status.className = "code-copy-status";
    status.setAttribute("role", "status");
    let reset;
    button.addEventListener("click", async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(source);
        button.textContent = status.textContent = labels.copied;
      } catch {
        button.textContent = labels.failed;
        status.textContent = labels.help;
      }
      reset = setTimeout(() => {
        button.textContent = labels.copy;
        status.textContent = "";
      }, 2500);
    });
    toolbar.append(status, button);
    pre.before(block);
    block.append(toolbar, pre);
  });
})();
