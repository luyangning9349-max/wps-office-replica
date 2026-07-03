import { closeLingxiInputMenus } from "./lingxi-input.js";

const STORAGE_KEY = "wps-lingxi-custom-skills";

const PDF_SKILLS = [
  { id: "article-outline", name: "文章大纲生成", icon: "doc" },
  { id: "speech-draft", name: "讲话稿创作", icon: "speech" },
  { id: "reflection", name: "心得体会撰写", icon: "write" },
  { id: "meeting-notes", name: "会议纪要整理", icon: "meeting" },
  { id: "notice-draft", name: "通知公告起草", icon: "notice" },
  { id: "application", name: "申请书撰写", icon: "apply" },
  { id: "certificate", name: "证明材料拟定", icon: "cert" },
  { id: "inspiration", name: "灵感市集", icon: "bulb" },
];

const BATCH_RESIZE_SKILL = {
  id: "batch-resize-images",
  name: "批量调整图片大小",
  icon: "image-batch",
  prompt: "批量调整文档图片至统一大小",
  task: "batch-resize",
};

const BATCH_REPLACE_SKILL = {
  id: "batch-replace-text",
  name: "批量替换文本",
  icon: "text-replace",
  prompt: '将文档中的文本"a"批量替换为"b"',
  task: "batch-replace",
};

const BATCH_SKILL_DEFAULTS = {
  [BATCH_RESIZE_SKILL.id]: BATCH_RESIZE_SKILL,
  [BATCH_REPLACE_SKILL.id]: BATCH_REPLACE_SKILL,
};

function loadCustomSkills() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((skill) =>
      BATCH_SKILL_DEFAULTS[skill.id]
        ? { ...skill, name: BATCH_SKILL_DEFAULTS[skill.id].name }
        : skill
    );
  } catch {
    return [];
  }
}

function saveCustomSkills(skills) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
}

function getSkillIconMarkup(type) {
  const icons = {
    doc: '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="5" y="3" width="10" height="14" rx="1.5" fill="#eef4ff" stroke="#7b61ff" stroke-width="1.2"/><path d="M7 7h6M7 10h5" stroke="#7b61ff" stroke-width="1.1" stroke-linecap="round"/></svg>',
    speech: '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="4" y="5" width="12" height="8" rx="1.2" fill="#fff6eb" stroke="#f5a623" stroke-width="1.2"/><path d="M7 13v2M13 13v2" stroke="#f5a623" stroke-width="1.2" stroke-linecap="round"/></svg>',
    write: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M5 14l2-6 6-2 2 6-6 2z" fill="#eefafa" stroke="#3ecfcf" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    meeting: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 6h12v9H4z" fill="#eef4ff" stroke="#2b7de9" stroke-width="1.2"/><path d="M7 4v2M13 4v2" stroke="#2b7de9" stroke-width="1.2" stroke-linecap="round"/></svg>',
    notice: '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="4" y="3" width="12" height="14" rx="1.5" fill="#fff0f0" stroke="#e7433a" stroke-width="1.2"/><circle cx="10" cy="13" r="2" fill="#e7433a"/></svg>',
    apply: '<svg viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="10" r="7" fill="#f3f0ff" stroke="#7b61ff" stroke-width="1.2"/><path d="M7 10h6M10 7v6" stroke="#7b61ff" stroke-width="1.2" stroke-linecap="round"/></svg>',
    cert: '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="4" y="5" width="12" height="10" rx="1.2" fill="#fff6eb" stroke="#f5a623" stroke-width="1.2"/><path d="M7 9h6M7 12h4" stroke="#f5a623" stroke-width="1.1" stroke-linecap="round"/></svg>',
    bulb: '<svg viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="9" r="5" fill="#fff6eb" stroke="#f5a623" stroke-width="1.2"/><path d="M8 15h4M9 17h2" stroke="#f5a623" stroke-width="1.2" stroke-linecap="round"/></svg>',
    "image-batch": '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="3" y="4" width="6" height="5" rx="0.8" fill="#f3f0ff" stroke="#7b61ff" stroke-width="1.1"/><rect x="11" y="4" width="6" height="7" rx="0.8" fill="#f3f0ff" stroke="#7b61ff" stroke-width="1.1"/><rect x="3" y="11" width="6" height="5" rx="0.8" fill="#f3f0ff" stroke="#7b61ff" stroke-width="1.1"/></svg>',
    "text-replace": '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 5.5h7M4 9.5h5M4 13.5H7.5" stroke="#7b61ff" stroke-width="1.2" stroke-linecap="round"/><path d="M12.5 4.5l2.5 2.5-5 5H9.5V9l5-4.5z" fill="#7b61ff"/><path d="M13.5 12.5H16a1 1 0 011 1v2.5a1 1 0 01-1 1h-2.5" stroke="#7b61ff" stroke-width="1.1" stroke-linecap="round"/></svg>',
  };
  return icons[type] || icons.doc;
}

function renderSkillItem(skill) {
  const li = document.createElement("li");
  li.innerHTML = `
    <button class="lingxi-skill-item" type="button" data-skill-id="${skill.id}">
      <span class="lingxi-skill-item__icon" aria-hidden="true">${getSkillIconMarkup(skill.icon)}</span>
      <span class="lingxi-skill-item__name">${skill.name}</span>
    </button>
  `;
  li.querySelector(".lingxi-skill-item")?.addEventListener("click", () => {
    onSkillSelect?.(skill);
  });
  return li;
}

let onSkillSelect = null;
let skillPanelOpen = false;

export function initLingxiSkills({ onSelect } = {}) {
  onSkillSelect = onSelect;
  renderSkillLists();
  bindSkillPanel();
}

export function renderSkillLists(filter = "") {
  const list = document.getElementById("lingxiSkillList");
  if (!list) return;

  const keyword = filter.trim().toLowerCase();
  const match = (skill) => !keyword || skill.name.toLowerCase().includes(keyword);

  const customSkills = loadCustomSkills().filter(match);
  const defaultSkills = PDF_SKILLS.filter(match).map((skill) => ({
    ...skill,
    prompt: `请帮我${skill.name}`,
  }));

  list.innerHTML = "";
  [...customSkills, ...defaultSkills].forEach((skill) => {
    list.appendChild(renderSkillItem(skill));
  });
}

export function skillCreate(context) {
  const template =
    context?.type === "batch-replace"
      ? BATCH_REPLACE_SKILL
      : context?.type === "batch-resize"
        ? BATCH_RESIZE_SKILL
        : null;

  if (!template) return { ok: false };

  const custom = loadCustomSkills();
  const requirement = context.requirement?.trim() || template.prompt;
  const skill = {
    ...template,
    name: context.name?.trim() || template.name,
    prompt: requirement,
    description: context.description?.trim() || "",
    trigger: context.trigger?.trim() || "",
    createdAt: Date.now(),
    context: context.summary || "",
  };

  const existingIndex = custom.findIndex((s) => s.id === template.id);
  if (existingIndex >= 0) {
    custom[existingIndex] = {
      ...custom[existingIndex],
      ...skill,
      updatedAt: Date.now(),
    };
    saveCustomSkills(custom);
    renderSkillLists();
    return { ok: true, existed: true, skill: custom[existingIndex] };
  }

  custom.unshift(skill);
  saveCustomSkills(custom);
  renderSkillLists();
  return { ok: true, existed: false, skill };
}

export function getDefaultSkillRequirement(task = "batch-resize") {
  if (task === "batch-replace") return BATCH_REPLACE_SKILL.prompt;
  return BATCH_RESIZE_SKILL.prompt;
}

function bindSkillPanel() {
  const panel = document.getElementById("lingxiSkillPanel");
  const toggleBtn = document.getElementById("lingxiSkillToggle");
  const searchInput = document.getElementById("lingxiSkillSearch");
  const footer = document.querySelector(".lingxi-sidebar__footer");

  toggleBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeLingxiInputMenus();
    skillPanelOpen = !skillPanelOpen;
    panel?.toggleAttribute("hidden", !skillPanelOpen);
    toggleBtn.classList.toggle("lingxi-input-box__tool--active", skillPanelOpen);
    toggleBtn.setAttribute("aria-expanded", skillPanelOpen ? "true" : "false");
    if (skillPanelOpen) searchInput?.focus();
  });

  searchInput?.addEventListener("input", () => {
    renderSkillLists(searchInput.value);
  });

  document.addEventListener("click", (event) => {
    if (!skillPanelOpen || !footer) return;
    if (footer.contains(event.target)) return;
    skillPanelOpen = false;
    panel?.setAttribute("hidden", "");
    toggleBtn?.classList.remove("lingxi-input-box__tool--active");
    toggleBtn?.setAttribute("aria-expanded", "false");
  });
}

export function showSkillToast(message) {
  const anchor = document.getElementById("lingxiSkillToggle");
  const footer = document.querySelector(".lingxi-sidebar__footer");
  if (!anchor || !footer) return;

  document.querySelector(".lingxi-skill-toast")?.remove();

  const toast = document.createElement("div");
  toast.className = "lingxi-skill-toast";
  toast.innerHTML = `
    <span class="lingxi-skill-toast__text">${message}</span>
    <span class="lingxi-skill-toast__arrow" aria-hidden="true"></span>
  `;
  footer.appendChild(toast);

  const positionToast = () => {
    const anchorRect = anchor.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const centerX = anchorRect.left + anchorRect.width / 2 - footerRect.left;
    const bottom = footerRect.bottom - anchorRect.top + 10;

    toast.style.left = `${centerX}px`;
    toast.style.bottom = `${bottom}px`;
  };

  requestAnimationFrame(() => {
    positionToast();
    toast.classList.add("lingxi-skill-toast--visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("lingxi-skill-toast--visible");
    window.setTimeout(() => toast.remove(), 280);
  }, 3000);
}
