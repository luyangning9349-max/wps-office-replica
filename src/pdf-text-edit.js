import { onTextReplaceEdit } from "./float-widget-controller.js";
import {
  EDITABLE_SELECTORS,
  SINGLE_LINE_EDITABLE_SELECTORS,
} from "./pdf-editable-config.js";

function countToken(text, token) {
  if (!token) return 0;
  return text.split(token).length - 1;
}

export function initTextEdit() {
  const nodes = document.querySelectorAll(EDITABLE_SELECTORS.join(","));

  nodes.forEach((el) => {
    let textBeforeEdit = el.textContent;

    el.classList.add("report-editable");
    el.setAttribute("contenteditable", "true");
    el.setAttribute("spellcheck", "false");

    el.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });

    el.addEventListener("focus", () => {
      textBeforeEdit = el.textContent;
    });

    el.addEventListener("blur", () => {
      const textAfterEdit = el.textContent;
      const before2025 = countToken(textBeforeEdit, "2025");
      const after2025 = countToken(textAfterEdit, "2025");
      const before2026 = countToken(textBeforeEdit, "2026");
      const after2026 = countToken(textAfterEdit, "2026");

      if (after2025 < before2025 && after2026 > before2026) {
        onTextReplaceEdit();
      }

      textBeforeEdit = textAfterEdit;
    });

    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      if (el.matches(SINGLE_LINE_EDITABLE_SELECTORS)) {
        event.preventDefault();
      }
    });
  });
}
