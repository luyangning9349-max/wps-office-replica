import { askLingxi, isLingxiAsking } from "./lingxi-chat.js";

const MODELS = [
  { id: "kimi", label: "Kimi v2.5", desc: "长文档理解" },
  { id: "lingxi-pro", label: "灵犀 Pro", desc: "办公场景优化" },
  { id: "qwen", label: "通义千问 Max", desc: "综合能力强" },
  { id: "gpt4o", label: "GPT-4o", desc: "多模态推理" },
];

const ATTACH_ITEMS = [
  { id: "image", label: "上传图片", icon: "image" },
  { id: "file", label: "上传文件", icon: "file" },
  { id: "pdf", label: "从当前 PDF 选择", icon: "pdf" },
];

const SLASH_ITEMS = [
  { label: "智能摘要", prompt: "请总结当前 PDF 的核心内容" },
  { label: "合同审查", prompt: "请审查当前文档中的合同风险与关键条款" },
  { label: "全文翻译", prompt: "请将当前 PDF 翻译为中文" },
  { label: "排版优化", prompt: "请优化当前文档的版式与排版" },
  { label: "提炼要点", prompt: "请提炼文档中的关键要点" },
];

const AT_ITEMS = [
  { label: "文档助手", tag: "文档助手" },
  { label: "翻译专家", tag: "翻译专家" },
  { label: "数据分析师", tag: "数据分析师" },
  { label: "法务顾问", tag: "法务顾问" },
];

const ICONS = {
  image:
    '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="3" y="4" width="14" height="12" rx="1.5" fill="#eef4ff" stroke="#7b61ff" stroke-width="1.2"/><circle cx="7.5" cy="8.5" r="1.2" fill="#7b61ff"/><path d="M3 14l4-3 3 2 3-4 4 5" stroke="#7b61ff" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>',
  file:
    '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="5" y="3" width="10" height="14" rx="1.5" fill="#eefafa" stroke="#3ecfcf" stroke-width="1.2"/><path d="M7 7h6M7 10h5" stroke="#3ecfcf" stroke-width="1.1" stroke-linecap="round"/></svg>',
  pdf:
    '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="4" y="3" width="12" height="14" rx="1.5" fill="#fff0f0" stroke="#e7433a" stroke-width="1.2"/><path d="M7 7h6M7 10h6M7 13h4" stroke="#e7433a" stroke-width="1.1" stroke-linecap="round"/></svg>',
};

let activeMenu = null;
let selectedModel = MODELS[0];
let slashReplaceStart = -1;
let atReplaceStart = -1;
let replaceParamsCallback = null;
let resizeParamsCallback = null;

function setBatchParamsActive(active) {
  const wrap = document.getElementById("lingxiInputWrap");
  wrap?.classList.toggle("lingxi-input-wrap--batch-params", active);
}

export function hideBatchReplaceParamsPanel() {
  const panel = document.getElementById("lingxiReplaceParams");
  panel?.setAttribute("hidden", "");
  replaceParamsCallback = null;
  if (!resizeParamsCallback) setBatchParamsActive(false);
}

export function hideBatchResizeParamsPanel() {
  const panel = document.getElementById("lingxiResizeParams");
  panel?.setAttribute("hidden", "");
  resizeParamsCallback = null;
  if (!replaceParamsCallback) setBatchParamsActive(false);
}

export function showBatchReplaceParamsPanel({ onConfirm, search = "", replace = "" } = {}) {
  const panel = document.getElementById("lingxiReplaceParams");
  const searchInput = document.getElementById("lingxiReplaceSearchInput");
  const targetInput = document.getElementById("lingxiReplaceTargetInput");

  if (!panel || !onConfirm) return;

  hideBatchResizeParamsPanel();
  closeLingxiInputMenus();
  replaceParamsCallback = onConfirm;
  if (searchInput) searchInput.value = search;
  if (targetInput) targetInput.value = replace;
  panel.removeAttribute("hidden");
  setBatchParamsActive(true);
  window.setTimeout(() => searchInput?.focus(), 0);
}

function syncResizeCustomFieldVisibility() {
  const modeSelect = document.getElementById("lingxiResizeModeSelect");
  const customField = document.getElementById("lingxiResizeCustomField");
  const isCustom = modeSelect?.value === "custom";
  if (!customField) return;
  customField.toggleAttribute("hidden", !isCustom);
}

export function showBatchResizeParamsPanel({ onConfirm, mode = "fit-width", customSize = "" } = {}) {
  const panel = document.getElementById("lingxiResizeParams");
  const modeSelect = document.getElementById("lingxiResizeModeSelect");
  const customInput = document.getElementById("lingxiResizeCustomInput");

  if (!panel || !onConfirm) return;

  hideBatchReplaceParamsPanel();
  closeLingxiInputMenus();
  resizeParamsCallback = onConfirm;
  if (modeSelect) modeSelect.value = mode;
  if (customInput) customInput.value = customSize;
  syncResizeCustomFieldVisibility();
  panel.removeAttribute("hidden");
  setBatchParamsActive(true);
  window.setTimeout(() => modeSelect?.focus(), 0);
}

export function closeLingxiInputMenus() {
  document.querySelectorAll(".lingxi-input-popover").forEach((el) => {
    el.hidden = true;
  });
  activeMenu = null;
}

export function resetLingxiInput() {
  closeLingxiInputMenus();
  hideBatchReplaceParamsPanel();
  hideBatchResizeParamsPanel();
  document.getElementById("lingxiSkillPanel")?.setAttribute("hidden", "");
  document.getElementById("lingxiSkillToggle")?.classList.remove("lingxi-input-box__tool--active");

  const { textarea } = getElements();
  if (textarea) {
    textarea.value = "";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function getElements() {
  return {
    wrap: document.getElementById("lingxiInputWrap"),
    textarea: document.querySelector(".lingxi-input-box__textarea"),
    sendBtn: document.getElementById("lingxiSendBtn"),
    clearBtn: document.getElementById("lingxiClearBtn"),
    attachBtn: document.getElementById("lingxiAttachBtn"),
    modelBtn: document.getElementById("lingxiModelToggle"),
    modelLabel: document.querySelector(".lingxi-input-box__model-label"),
    attachMenu: document.getElementById("lingxiAttachMenu"),
    modelMenu: document.getElementById("lingxiModelMenu"),
    slashMenu: document.getElementById("lingxiSlashMenu"),
    atMenu: document.getElementById("lingxiAtMenu"),
    tip: document.getElementById("lingxiInputTip"),
  };
}

function openMenu(name, menu) {
  closeLingxiInputMenus();
  if (!menu) return;
  menu.hidden = false;
  activeMenu = name;
}

function toggleMenu(name, menu) {
  if (activeMenu === name) {
    closeLingxiInputMenus();
    return;
  }
  openMenu(name, menu);
}

function buildMenuItems(container, items, onSelect) {
  container.innerHTML = items
    .map(
      (item, index) => `
      <button class="lingxi-input-popover__item" type="button" data-index="${index}">
        ${item.icon ? `<span class="lingxi-input-popover__icon">${ICONS[item.icon] || ""}</span>` : ""}
        <span class="lingxi-input-popover__text">
          <span class="lingxi-input-popover__label">${item.label}</span>
          ${item.desc ? `<span class="lingxi-input-popover__desc">${item.desc}</span>` : ""}
        </span>
      </button>`
    )
    .join("");

  container.querySelectorAll(".lingxi-input-popover__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = items[Number(btn.dataset.index)];
      onSelect(item);
      closeLingxiInputMenus();
    });
  });
}

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  const next = Math.min(textarea.scrollHeight, 120);
  textarea.style.height = `${Math.max(next, 48)}px`;
}

function updateSendState(textarea, sendBtn, clearBtn) {
  const hasText = textarea.value.trim().length > 0;
  const busy = isLingxiAsking();
  sendBtn.disabled = !hasText || busy;
  sendBtn.classList.toggle("lingxi-input-box__send--disabled", !hasText || busy);
  clearBtn.hidden = !hasText;
}

function showTip(message) {
  const { tip } = getElements();
  if (!tip) return;
  tip.textContent = message;
  tip.hidden = false;
  clearTimeout(showTip.timer);
  showTip.timer = window.setTimeout(() => {
    tip.hidden = true;
  }, 2200);
}

function detectSlashMenu(textarea, slashMenu) {
  const value = textarea.value;
  const pos = textarea.selectionStart;
  const before = value.slice(0, pos);
  const match = before.match(/(?:^|\s)\/([^\s]*)$/);

  if (!match) {
    slashMenu.hidden = true;
    if (activeMenu === "slash") activeMenu = null;
    slashReplaceStart = -1;
    return;
  }

  slashReplaceStart = pos - match[1].length - 1;
  const query = match[1].toLowerCase();
  const filtered = SLASH_ITEMS.filter((item) => item.label.toLowerCase().includes(query));

  if (!filtered.length) {
    slashMenu.hidden = true;
    return;
  }

  buildMenuItems(slashMenu.querySelector(".lingxi-input-popover__list"), filtered, (item) => {
    const end = textarea.selectionStart;
    textarea.value = value.slice(0, slashReplaceStart) + item.prompt + value.slice(end);
    autoResizeTextarea(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    updateSendState(textarea, getElements().sendBtn, getElements().clearBtn);
  });

  openMenu("slash", slashMenu);
}

function detectAtMenu(textarea, atMenu) {
  const value = textarea.value;
  const pos = textarea.selectionStart;
  const before = value.slice(0, pos);
  const match = before.match(/@([^\s@]*)$/);

  if (!match) {
    atMenu.hidden = true;
    if (activeMenu === "at") activeMenu = null;
    atReplaceStart = -1;
    return;
  }

  atReplaceStart = pos - match[1].length - 1;
  const query = match[1].toLowerCase();
  const filtered = AT_ITEMS.filter((item) => item.label.toLowerCase().includes(query));

  if (!filtered.length) {
    atMenu.hidden = true;
    return;
  }

  buildMenuItems(atMenu.querySelector(".lingxi-input-popover__list"), filtered, (item) => {
    const end = textarea.selectionStart;
    textarea.value = `${value.slice(0, atReplaceStart)}@${item.tag} ${value.slice(end)}`;
    autoResizeTextarea(textarea);
    textarea.focus();
    const cursor = atReplaceStart + item.tag.length + 2;
    textarea.setSelectionRange(cursor, cursor);
    updateSendState(textarea, getElements().sendBtn, getElements().clearBtn);
  });

  openMenu("at", atMenu);
}

function submitBatchReplaceParams() {
  const searchInput = document.getElementById("lingxiReplaceSearchInput");
  const targetInput = document.getElementById("lingxiReplaceTargetInput");
  const search = searchInput?.value.trim() || "";
  const replace = targetInput?.value.trim() || "";

  if (!search || !replace) {
    showTip("请填写查找文本和替换文本");
    return;
  }

  if (search === replace) {
    showTip("查找文本与替换文本不能相同");
    return;
  }

  const callback = replaceParamsCallback;
  hideBatchReplaceParamsPanel();
  callback?.({ search, replace });
}

function bindBatchResizeParamsPanel() {
  const modeSelect = document.getElementById("lingxiResizeModeSelect");

  modeSelect?.addEventListener("change", () => {
    syncResizeCustomFieldVisibility();
  });

  document.getElementById("lingxiResizeParamsConfirm")?.addEventListener("click", () => {
    submitBatchResizeParams();
  });

  document.getElementById("lingxiResizeParamsCancel")?.addEventListener("click", () => {
    hideBatchResizeParamsPanel();
  });

  document.getElementById("lingxiResizeCustomInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitBatchResizeParams();
    }
    if (event.key === "Escape") hideBatchResizeParamsPanel();
  });
}

function submitBatchResizeParams() {
  const modeSelect = document.getElementById("lingxiResizeModeSelect");
  const customInput = document.getElementById("lingxiResizeCustomInput");
  const mode = modeSelect?.value || "fit-width";

  let customSize = Number(customInput?.value);
  if (mode === "custom") {
    if (!Number.isFinite(customSize) || customSize < 80 || customSize > 536) {
      showTip("请输入 80–536 之间的自定义宽度");
      return;
    }
  } else {
    customSize = 420;
  }

  const callback = resizeParamsCallback;
  hideBatchResizeParamsPanel();
  callback?.({ mode, customSize });
}

function bindBatchReplaceParamsPanel() {
  document.getElementById("lingxiReplaceParamsConfirm")?.addEventListener("click", () => {
    submitBatchReplaceParams();
  });

  document.getElementById("lingxiReplaceParamsCancel")?.addEventListener("click", () => {
    hideBatchReplaceParamsPanel();
  });

  document.getElementById("lingxiReplaceSearchInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("lingxiReplaceTargetInput")?.focus();
    }
  });

  document.getElementById("lingxiReplaceTargetInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitBatchReplaceParams();
    }
    if (event.key === "Escape") hideBatchReplaceParamsPanel();
  });
}

export async function submitLingxiQuestion(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return askLingxi(trimmed);
}

async function handleSend() {
  const { textarea, sendBtn, clearBtn } = getElements();
  const text = textarea.value.trim();
  if (!text || sendBtn?.disabled) return;

  textarea.value = "";
  autoResizeTextarea(textarea);
  updateSendState(textarea, sendBtn, clearBtn);
  closeLingxiInputMenus();

  await askLingxi(text);
  updateSendState(textarea, sendBtn, clearBtn);
}

export function initLingxiInput() {
  const els = getElements();
  const {
    textarea,
    sendBtn,
    clearBtn,
    attachBtn,
    modelBtn,
    modelLabel,
    attachMenu,
    modelMenu,
    slashMenu,
    atMenu,
  } = els;

  if (!textarea || !sendBtn) return;

  bindBatchReplaceParamsPanel();
  bindBatchResizeParamsPanel();

  buildMenuItems(attachMenu?.querySelector(".lingxi-input-popover__list"), ATTACH_ITEMS, (item) => {
    if (item.id === "pdf") {
      showTip("已读取当前 PDF 页面上下文");
      return;
    }
    showTip(item.id === "image" ? "请选择图片文件" : "请选择文件");
  });

  buildMenuItems(modelMenu?.querySelector(".lingxi-input-popover__list"), MODELS, (item) => {
    selectedModel = item;
    if (modelLabel) modelLabel.textContent = item.label;
    modelMenu.querySelectorAll(".lingxi-input-popover__item").forEach((btn) => {
      btn.classList.toggle(
        "lingxi-input-popover__item--active",
        MODELS[Number(btn.dataset.index)]?.id === item.id
      );
    });
  });

  attachBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    document.getElementById("lingxiSkillPanel")?.setAttribute("hidden", "");
    document.getElementById("lingxiSkillToggle")?.classList.remove("lingxi-input-box__tool--active");
    toggleMenu("attach", attachMenu);
  });

  modelBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu("model", modelMenu);
  });

  clearBtn?.addEventListener("click", () => {
    textarea.value = "";
    autoResizeTextarea(textarea);
    updateSendState(textarea, sendBtn, clearBtn);
    textarea.focus();
    closeLingxiInputMenus();
  });

  sendBtn.addEventListener("click", handleSend);

  textarea.addEventListener("input", () => {
    autoResizeTextarea(textarea);
    updateSendState(textarea, sendBtn, clearBtn);
    detectSlashMenu(textarea, slashMenu);
    detectAtMenu(textarea, atMenu);
  });

  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
      return;
    }

    if (event.key === "Escape") {
      closeLingxiInputMenus();
    }
  });

  textarea.addEventListener("click", () => {
    detectSlashMenu(textarea, slashMenu);
    detectAtMenu(textarea, atMenu);
  });

  document.addEventListener("click", (event) => {
    if (els.wrap?.contains(event.target)) return;
    closeLingxiInputMenus();
  });

  autoResizeTextarea(textarea);
  updateSendState(textarea, sendBtn, clearBtn);
}
