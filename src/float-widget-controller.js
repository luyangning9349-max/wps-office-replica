import { openLingxiSidebar } from "./lingxi-sidebar.js";

const RESIZE_THRESHOLD = 3;
const REPLACE_THRESHOLD = 2;

const BATCH_CONFIG = {
  "batch-resize": {
    compactLabel: "批量调整图片大小",
    menuSelector: ".float-menu-item--batch-resize",
    ariaLabel: "批量调整图片大小，打开灵犀侧边栏",
    iconClass: "float-widget__icon--batch",
  },
  "batch-replace": {
    compactLabel: "将2025替换为2026",
    menuSelector: ".float-menu-item--batch-replace",
    ariaLabel: "将2025替换为2026，打开灵犀侧边栏",
    iconClass: "float-widget__icon--replace",
  },
};

const REPLACE_ICON_HTML = `
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
    <path d="M3 4.5h6.5M3 8h4.5M3 11.5H6" stroke="#7B61FF" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M10.5 3.5l2 2-4.5 4.5H8V8l4.5-4.5z" fill="#7B61FF"/>
    <path d="M12.5 10.5H14a1 1 0 011 1v2a1 1 0 01-1 1h-2" stroke="#7B61FF" stroke-width="1.1" stroke-linecap="round"/>
  </svg>
`;

const RESIZE_ICON_HTML = `
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
    <rect x="2" y="3" width="5" height="4" rx="0.8" stroke="#7B61FF" stroke-width="1.2"/>
    <rect x="9" y="3" width="5" height="6" rx="0.8" stroke="#7B61FF" stroke-width="1.2"/>
    <rect x="2" y="9" width="5" height="4" rx="0.8" stroke="#7B61FF" stroke-width="1.2"/>
    <path d="M9 12h5" stroke="#7B61FF" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`;

let batchTaskType = null;
let resizeCount = 0;
let replaceEditCount = 0;

export function getFloatWidgetMode() {
  return batchTaskType || "default";
}

export function onImageResizeComplete() {
  if (batchTaskType) return;

  resizeCount += 1;
  if (resizeCount >= RESIZE_THRESHOLD) {
    morphToBatchTask("batch-resize");
  }
}

export function onTextReplaceEdit() {
  if (batchTaskType) return;

  replaceEditCount += 1;
  if (replaceEditCount >= REPLACE_THRESHOLD) {
    morphToBatchTask("batch-replace");
  }
}

function morphToBatchTask(taskType) {
  const widget = document.getElementById("floatWidget");
  const config = BATCH_CONFIG[taskType];
  if (!widget || !config || batchTaskType) return;

  batchTaskType = taskType;
  widget.dataset.mode = taskType;
  widget.classList.add("float-widget--ai-morphing");
  widget.classList.remove("is-expanded");

  const defaultCompact = widget.querySelector(".float-widget__compact--default");
  const batchCompact = widget.querySelector(".float-widget__compact--batch");
  const batchLabel = batchCompact?.querySelector(".float-widget__label");
  const batchIcon = batchCompact?.querySelector(".float-widget__icon");

  if (batchLabel) batchLabel.textContent = config.compactLabel;
  if (batchCompact) batchCompact.setAttribute("aria-label", config.ariaLabel);
  if (batchIcon) {
    batchIcon.className = `float-widget__icon ${config.iconClass}`;
    batchIcon.innerHTML = taskType === "batch-replace" ? REPLACE_ICON_HTML : RESIZE_ICON_HTML;
  }

  batchCompact?.removeAttribute("hidden");

  window.setTimeout(() => {
    widget.classList.remove("float-widget--ai-morphing");
    widget.classList.add("float-widget--batch-mode");

    defaultCompact?.setAttribute("hidden", "");
    batchCompact?.removeAttribute("hidden");

    configureBatchPanel(widget, taskType);
  }, 1200);
}

function configureBatchPanel(widget, taskType) {
  const config = BATCH_CONFIG[taskType];
  const defaultActiveItem = widget.querySelector(
    ".float-menu-item:not(.float-menu-item--batch-resize):not(.float-menu-item--batch-replace).float-menu-item--active"
  );

  widget
    .querySelectorAll(".float-menu-item--batch-resize, .float-menu-item--batch-replace")
    .forEach((item) => {
      item.setAttribute("hidden", "");
      item.classList.remove("float-menu-item--active");
    });

  defaultActiveItem?.classList.remove("float-menu-item--active");
  const batchMenuItem = widget.querySelector(config.menuSelector);
  batchMenuItem?.removeAttribute("hidden");
  batchMenuItem?.classList.add("float-menu-item--active");
}

function openBatchTaskFromFloat(event) {
  if (!batchTaskType) return;
  event?.stopPropagation();
  const options = { task: batchTaskType, source: "float" };
  if (batchTaskType === "batch-replace") {
    options.replaceParams = { search: "2025", replace: "2026" };
  }
  openLingxiSidebar(options);
}

export function initFloatWidgetController() {
  const widget = document.getElementById("floatWidget");
  if (!widget) return;

  widget.dataset.mode = "default";

  const batchCompact = widget.querySelector(".float-widget__compact--batch");
  const batchMenuItems = widget.querySelectorAll(
    ".float-menu-item--batch-resize, .float-menu-item--batch-replace"
  );

  batchCompact?.addEventListener("click", openBatchTaskFromFloat);
  batchMenuItems.forEach((item) => {
    item.addEventListener("click", openBatchTaskFromFloat);
  });

  batchCompact?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openBatchTaskFromFloat(event);
    }
  });
}
