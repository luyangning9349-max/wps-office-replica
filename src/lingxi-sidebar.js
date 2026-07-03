import { runBatchImageResize } from "./lingxi-batch-resize.js";
import { runBatchTextReplace } from "./lingxi-batch-replace.js";
import { clearLingxiChat } from "./lingxi-chat.js";
import { initLingxiInput, resetLingxiInput, showBatchReplaceParamsPanel, hideBatchReplaceParamsPanel, showBatchResizeParamsPanel, hideBatchResizeParamsPanel } from "./lingxi-input.js";
import {
  initLingxiSkills,
  skillCreate,
  showSkillToast,
} from "./lingxi-skills.js";
import { buildSkillDraft, mountSkillCreateWizard } from "./lingxi-skill-create-flow.js";

let sidebarApi = null;
let batchRunning = false;
let skillCreateRunning = false;
let lastBatchSummary = "";
let batchProgressEl = null;
let activeBatchTask = null;
let batchTaskSource = "float";
let batchReplaceParams = { search: "2025", replace: "2026" };
let batchResizeParams = { mode: "fit-width", customSize: 420 };

export function openLingxiSidebar(options = {}) {
  sidebarApi?.open(options);
}

export function initLingxiSidebar() {
  const workspace = document.getElementById("workspace");
  const sidebar = document.getElementById("lingxiSidebar");
  const wpsAiTab = document.getElementById("wpsAiTab");
  const closeBtn = document.getElementById("lingxiSidebarClose");
  const newSessionBtn = document.getElementById("lingxiNewSessionBtn");
  const ribbonTabs = document.querySelectorAll(".ribbon-tab");
  const welcome = document.getElementById("lingxiWelcome");
  const taskPanel = document.getElementById("lingxiTaskPanel");

  if (!workspace || !sidebar || !wpsAiTab) return;

  initLingxiInput();

  initLingxiSkills({
    onSelect(skill) {
      const textarea = sidebar.querySelector(".lingxi-input-box__textarea");
      if (!textarea) return;

      document.getElementById("lingxiSkillPanel")?.setAttribute("hidden", "");
      document.getElementById("lingxiSkillToggle")?.classList.remove("lingxi-input-box__tool--active");

      if (skill.task === "batch-resize") {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        openLingxiSidebar({});
        showBatchResizeParamsPanel({
          onConfirm: (resizeParams) => {
            openLingxiSidebar({
              task: "batch-resize",
              source: "skill",
              resizeParams,
            });
          },
        });
        return;
      }

      if (skill.task === "batch-replace") {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        openLingxiSidebar({});
        showBatchReplaceParamsPanel({
          onConfirm: ({ search, replace }) => {
            openLingxiSidebar({
              task: "batch-replace",
              source: "skill",
              replaceParams: { search, replace },
            });
          },
        });
        return;
      }

      const question = skill.prompt || `请帮我${skill.name}`;
      textarea.value = "";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      submitLingxiQuestion(question);
    },
  });

  const setOpen = (open, options = {}) => {
    const { task, replaceParams, resizeParams, source = "float" } = options;
    workspace.classList.toggle("workspace--sidebar-open", open);
    sidebar.setAttribute("aria-hidden", open ? "false" : "true");
    wpsAiTab.setAttribute("aria-expanded", open ? "true" : "false");
    wpsAiTab.classList.toggle("ribbon-tab--active", open);

    if (open) {
      ribbonTabs.forEach((tab) => {
        if (tab !== wpsAiTab) tab.classList.remove("ribbon-tab--active");
      });

      const isBatch = task === "batch-resize" || task === "batch-replace";
      const chat = document.getElementById("lingxiChat");
      const hasChat = chat && !chat.hidden && chat.children.length > 0;
      welcome?.toggleAttribute("hidden", isBatch || hasChat);
      taskPanel?.toggleAttribute("hidden", !isBatch);
      sidebar.classList.toggle("lingxi-sidebar--batch-task", isBatch);
      activeBatchTask = isBatch ? task : null;

      if (task === "batch-resize") {
        batchTaskSource = source;
        if (resizeParams) {
          batchResizeParams = { ...resizeParams };
        }
        hideBatchResizeParamsPanel();
        hideBatchReplaceParamsPanel();
        startBatchResizeConversation();
      } else if (task === "batch-replace") {
        batchTaskSource = source;
        if (replaceParams) {
          batchReplaceParams = { ...replaceParams };
        }
        hideBatchReplaceParamsPanel();
        hideBatchResizeParamsPanel();
        startBatchReplaceConversation();
      }
    } else {
      welcome?.removeAttribute("hidden");
      taskPanel?.setAttribute("hidden", "");
      sidebar.classList.remove("lingxi-sidebar--batch-task");
      hideBatchReplaceParamsPanel();
      hideBatchResizeParamsPanel();
    }
  };

  const isOpen = () => workspace.classList.contains("workspace--sidebar-open");

  sidebarApi = {
    open(options = {}) {
      setOpen(true, options);
    },
    close() {
      setOpen(false);
    },
  };

  wpsAiTab.addEventListener("click", () => {
    if (isOpen()) setOpen(false);
    else setOpen(true, {});
  });

  closeBtn?.addEventListener("click", () => {
    setOpen(false);
    ribbonTabs.forEach((t) => t.classList.remove("ribbon-tab--active"));
    document.getElementById("ribbonTabHome")?.classList.add("ribbon-tab--active");
  });

  newSessionBtn?.addEventListener("click", () => {
    resetLingxiSession();
  });

  ribbonTabs.forEach((tab) => {
    if (tab === wpsAiTab) return;
    tab.addEventListener("click", () => {
      setOpen(false);
      ribbonTabs.forEach((t) => t.classList.remove("ribbon-tab--active"));
      tab.classList.add("ribbon-tab--active");
    });
  });

  document.querySelectorAll(".lingxi-suggest-card").forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.querySelector(".lingxi-suggest-card__title")?.textContent?.trim();
      if (!title) return;

      const textarea = sidebar.querySelector(".lingxi-input-box__textarea");
      if (textarea) {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const questionMap = {
        智能摘要: "请总结当前 PDF 的核心内容与关键要点",
        合同审查: "请审查当前文档中的合同风险与关键条款",
        内容摘要: "请解释 PDF 中的专业术语与核心内容",
        排版优化: "请优化当前文档的版式与排版建议",
      };

      submitLingxiQuestion(questionMap[title] || `请帮我${title}`);
    });
  });
}

function resetLingxiSession() {
  clearLingxiChat();
  resetLingxiInput();

  const welcome = document.getElementById("lingxiWelcome");
  const taskPanel = document.getElementById("lingxiTaskPanel");
  const batchChat = document.getElementById("lingxiBatchChat");
  const sidebar = document.getElementById("lingxiSidebar");

  welcome?.removeAttribute("hidden");
  taskPanel?.setAttribute("hidden", "");
  sidebar?.classList.remove("lingxi-sidebar--batch-task");

  if (batchChat) batchChat.innerHTML = "";
  batchRunning = false;
  skillCreateRunning = false;
  lastBatchSummary = "";
  activeBatchTask = null;
  batchTaskSource = "float";
  batchReplaceParams = { search: "2025", replace: "2026" };
  batchResizeParams = { mode: "fit-width", customSize: 420 };
  clearBatchProgressPanel();
}

function startBatchResizeConversation() {
  const chat = document.getElementById("lingxiBatchChat");
  if (chat) chat.innerHTML = "";
  batchRunning = false;
  skillCreateRunning = false;
  lastBatchSummary = "";
  clearBatchProgressPanel();

  if (batchTaskSource === "float") {
    appendAiMessage(
      "检测到您已多次手动调整图片大小，文档中的图片尺寸目前不一致。我可以帮您一键将所有图片统一为相同尺寸，让版式更整齐专业。"
    );
    window.setTimeout(() => startBatchResize(), 900);
    return;
  }

  startBatchResize();
}

function startBatchReplaceConversation() {
  const chat = document.getElementById("lingxiBatchChat");
  if (chat) chat.innerHTML = "";
  batchRunning = false;
  skillCreateRunning = false;
  lastBatchSummary = "";
  clearBatchProgressPanel();

  if (batchTaskSource === "float") {
    appendAiMessage(
      `检测到您已多次将「${batchReplaceParams.search}」修改为「${batchReplaceParams.replace}」，文档中可能仍有未替换的相同内容。我可以帮您一键完成全文批量替换。`
    );
    window.setTimeout(() => startBatchReplace(), 900);
    return;
  }

  startBatchReplace();
}

function clearBatchProgressPanel() {
  batchProgressEl?.remove();
  batchProgressEl = null;
}

function updateBatchProgressPanel({ text, current = 0, total = 0, unit = "张" }) {
  const chat = document.getElementById("lingxiBatchChat");
  if (!chat) return;

  if (!batchProgressEl) {
    const item = document.createElement("div");
    item.className = "lingxi-chat-item lingxi-chat-item--ai lingxi-chat-item--progress";
    item.innerHTML = `
      <div class="lingxi-chat-item__avatar" aria-hidden="true">✦</div>
      <div class="lingxi-chat-item__bubble lingxi-batch-progress">
        <p class="lingxi-batch-progress__status"></p>
        <div class="lingxi-batch-progress__track">
          <div class="lingxi-batch-progress__fill"></div>
        </div>
        <p class="lingxi-batch-progress__meta"></p>
      </div>
    `;
    chat.appendChild(item);
    batchProgressEl = item;
  }

  const status = batchProgressEl.querySelector(".lingxi-batch-progress__status");
  const track = batchProgressEl.querySelector(".lingxi-batch-progress__track");
  const fill = batchProgressEl.querySelector(".lingxi-batch-progress__fill");
  const meta = batchProgressEl.querySelector(".lingxi-batch-progress__meta");

  status.textContent = text;

  if (total > 0) {
    track.hidden = false;
    meta.hidden = false;
    const pct = Math.min(100, Math.round((current / total) * 100));
    fill.style.width = `${pct}%`;
    meta.textContent = `第 ${current}/${total} ${unit}`;
  } else {
    track.hidden = true;
    meta.hidden = true;
    fill.style.width = "0%";
  }

  chat.scrollTop = chat.scrollHeight;
}

function startBatchResize() {
  if (batchRunning) return;
  batchRunning = true;
  clearBatchProgressPanel();

  runBatchImageResize({
    mode: batchResizeParams.mode,
    customSize: batchResizeParams.customSize,
    onProgress: (payload) => {
      const data = typeof payload === "string" ? { text: payload } : payload;
      updateBatchProgressPanel(data);
    },
    onComplete: (summary) => {
      clearBatchProgressPanel();
      lastBatchSummary = summary;
      appendAiMessage(summary, {
        highlight: true,
        showFeedback: batchTaskSource === "float",
      });
      batchRunning = false;
    },
    onError: () => {
      clearBatchProgressPanel();
      batchRunning = false;
      appendAiMessage("处理时遇到问题，请稍后重试。");
    },
  });
}

function startBatchReplace() {
  if (batchRunning) return;
  batchRunning = true;
  clearBatchProgressPanel();

  runBatchTextReplace({
    search: batchReplaceParams.search,
    replace: batchReplaceParams.replace,
    onProgress: (payload) => {
      const data = typeof payload === "string" ? { text: payload } : payload;
      updateBatchProgressPanel(data);
    },
    onComplete: (summary) => {
      clearBatchProgressPanel();
      lastBatchSummary = summary;
      appendAiMessage(summary, {
        highlight: true,
        showFeedback: batchTaskSource === "float",
      });
      batchRunning = false;
    },
    onError: (error) => {
      clearBatchProgressPanel();
      batchRunning = false;
      if (error?.reason === "empty") {
        appendAiMessage(`文档中未找到「${batchReplaceParams.search}」，无需替换。`);
        return;
      }
      appendAiMessage("处理时遇到问题，请稍后重试。");
    },
  });
}

function appendAiMessage(
  text,
  {
    typing = false,
    highlight = false,
    showFeedback = false,
    showSkillCreateWizard = false,
  } = {}
) {
  const chat = document.getElementById("lingxiBatchChat");
  if (!chat) return;

  const item = document.createElement("div");
  item.className = `lingxi-chat-item lingxi-chat-item--ai${highlight ? " lingxi-chat-item--highlight" : ""}`;
  item.innerHTML = `
    <div class="lingxi-chat-item__avatar" aria-hidden="true">✦</div>
    <div class="lingxi-chat-item__bubble${showSkillCreateWizard ? " lingxi-chat-item__bubble--form" : ""}">
      ${text || typing ? '<p class="lingxi-chat-item__text"></p>' : ""}
      ${showFeedback ? `
        <div class="lingxi-chat-feedback">
          <button class="lingxi-chat-feedback__btn" type="button" data-feedback="up" aria-label="点赞">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4.5 7.5V14h2.2c.4 0 .8-.2 1-.5l2.4-4.2c.1-.2.1-.4.1-.6V4.8c0-.7-.6-1.3-1.3-1.3H7.8c-.4 0-.8.2-1 .5L4.5 7.5z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M2.5 7.5H4v6.5H2.8c-.5 0-.8-.4-.8-.8V8.3c0-.5.4-.8.8-.8h.7z" fill="currentColor"/>
            </svg>
          </button>
          <button class="lingxi-chat-feedback__btn" type="button" data-feedback="down" aria-label="点踩">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4.5 8.5V2h2.2c.4 0 .8.2 1 .5l2.4 4.2c.1.2.1.4.1.6v3.9c0 .7-.6 1.3-1.3 1.3H7.8c-.4 0-.8-.2-1-.5L4.5 8.5z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M2.5 8.5H4V2H2.8c-.5 0-.8.4-.8.8v4.9c0 .5.4.8.8.8h.7z" fill="currentColor"/>
            </svg>
          </button>
          <button class="lingxi-chat-feedback__save" type="button">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3 3h7l3 3v7a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" fill="none" stroke="currentColor" stroke-width="1.2"/>
              <path d="M9 3v4h4M6 9h4M6 11.5h2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
            </svg>
            <span>保存为技能</span>
          </button>
        </div>
      ` : ""}
    </div>
  `;
  chat.appendChild(item);

  const textEl = item.querySelector(".lingxi-chat-item__text");
  if (textEl) {
    if (typing) {
      typeText(textEl, text);
    } else if (text) {
      textEl.textContent = text;
    }
  }

  if (showFeedback) {
    bindFeedbackToolbar(item);
  }

  if (showSkillCreateWizard) {
    const wizardItem = item;
    const handleSkillConfirm = async (draft, { showLoading }) => {
      await wait(900);

      showLoading("正在生成技能配置…", 2);
      await wait(1100);

      showLoading("正在写入技能库…", 3);
      await wait(1000);

      const result = skillCreate({
        type: activeBatchTask || "batch-resize",
        summary: lastBatchSummary,
        name: draft.name,
        requirement: draft.requirement,
        description: draft.description,
        trigger: draft.trigger,
      });

      skillCreateRunning = false;

      if (result.ok) {
        showLoading("技能创建完成", 4);
        await wait(500);
        showSkillToast("已添加至技能库");
        appendAiMessage(
          `技能「${draft.name}」已创建完成，可在输入框技能库中一键复用。`
        );
        return;
      }

      appendAiMessage("技能创建失败，请稍后重试。");
      skillCreateRunning = true;
      mountSkillCreateWizard(wizardItem, {
        draft,
        onCancel: () => {
          skillCreateRunning = false;
          wizardItem.remove();
          appendAiMessage("已取消技能创建。");
        },
        onConfirm: handleSkillConfirm,
      });
    };

    mountSkillCreateWizard(wizardItem, {
      draft: buildSkillDraft({ summary: lastBatchSummary, task: activeBatchTask }),
      onCancel: () => {
        skillCreateRunning = false;
        wizardItem.remove();
        appendAiMessage("已取消技能创建。");
      },
      onConfirm: handleSkillConfirm,
    });
  }

  chat.scrollTop = chat.scrollHeight;
}

function bindFeedbackToolbar(item) {
  const feedback = item.querySelector(".lingxi-chat-feedback");
  if (!feedback) return;

  feedback.querySelectorAll("[data-feedback]").forEach((btn) => {
    btn.addEventListener("click", () => {
      feedback.querySelectorAll("[data-feedback]").forEach((b) => {
        b.classList.toggle("lingxi-chat-feedback__btn--active", b === btn);
      });
    });
  });

  const saveBtn = feedback.querySelector(".lingxi-chat-feedback__save");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", () => {
    if (skillCreateRunning) return;
    startSkillCreateFlow();
  });
}

function startSkillCreateFlow() {
  skillCreateRunning = true;
  const flowName =
    activeBatchTask === "batch-replace" ? "批量替换文本" : "批量调整图片大小";

  appendAiMessage("正在调用 skill_create，分析本次会话上下文…", { typing: true });

  window.setTimeout(() => {
    appendAiMessage(
      `已从本次「${flowName}」流程中识别到可复用能力。接下来将分 3 步为您创建技能。`
    );
    window.setTimeout(() => {
      appendAiMessage("", { showSkillCreateWizard: true });
    }, 500);
  }, 900);
}

function typeText(el, text) {
  let i = 0;
  el.textContent = "";
  const timer = window.setInterval(() => {
    i += 1;
    el.textContent = text.slice(0, i);
    if (i >= text.length) window.clearInterval(timer);
  }, 18);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
