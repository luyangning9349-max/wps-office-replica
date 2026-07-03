import { getDefaultSkillRequirement } from "./lingxi-skills.js";

export function buildSkillDraft(context = {}) {
  if (context.task === "batch-replace") {
    return {
      name: "批量替换文本",
      requirement: getDefaultSkillRequirement("batch-replace"),
      description: "在全文可编辑区域中，将指定关键词批量替换为目标文本，适用于年报修订、术语统一等场景。",
      trigger: "当用户多次手动将相同关键词替换为同一目标文本时",
      summary: context.summary || "",
      task: "batch-replace",
    };
  }

  return {
    name: "批量调整图片大小",
    requirement: getDefaultSkillRequirement("batch-resize"),
    description: "一键将 PDF 文档中的图片按等比例统一为相同宽度，保持版式整齐专业。",
    trigger: "当文档中图片尺寸不一致，或用户多次手动调整图片大小时",
    summary: context.summary || "",
    task: "batch-resize",
  };
}

export function renderSkillCreateWizardHtml(step, draft) {
  const flowName = draft.task === "batch-replace" ? "批量替换文本" : "批量调整图片";

  if (step === 1) {
    return `
      <div class="lingxi-skill-create" data-step="1">
        <div class="lingxi-skill-create__progress">
          <span class="lingxi-skill-create__step is-active">1</span>
          <span class="lingxi-skill-create__line"></span>
          <span class="lingxi-skill-create__step">2</span>
          <span class="lingxi-skill-create__line"></span>
          <span class="lingxi-skill-create__step">3</span>
        </div>
        <p class="lingxi-skill-create__phase">第 1 步 · 了解需求</p>
        <p class="lingxi-skill-create__hint">已从本次${flowName}的会话中识别到可复用流程，请确认或补充技能要解决的核心需求。</p>
        <label class="lingxi-skill-create__label" for="skillRequirement">技能需求</label>
        <textarea class="lingxi-skill-create__input" id="skillRequirement" rows="2" aria-label="技能需求">${draft.requirement}</textarea>
        <div class="lingxi-skill-create__actions">
          <button class="lingxi-skill-create__cancel" type="button">取消</button>
          <button class="lingxi-skill-create__next" type="button">下一步</button>
        </div>
      </div>
    `;
  }

  if (step === 2) {
    return `
      <div class="lingxi-skill-create" data-step="2">
        <div class="lingxi-skill-create__progress">
          <span class="lingxi-skill-create__step is-done">1</span>
          <span class="lingxi-skill-create__line is-done"></span>
          <span class="lingxi-skill-create__step is-active">2</span>
          <span class="lingxi-skill-create__line"></span>
          <span class="lingxi-skill-create__step">3</span>
        </div>
        <p class="lingxi-skill-create__phase">第 2 步 · 设计方案</p>
        <p class="lingxi-skill-create__hint">为技能命名，并补充描述与触发场景，便于后续在技能库中识别和复用。</p>
        <label class="lingxi-skill-create__label" for="skillName">技能名称</label>
        <input class="lingxi-skill-create__field" id="skillName" type="text" value="${draft.name}" aria-label="技能名称" />
        <label class="lingxi-skill-create__label" for="skillDescription">技能描述</label>
        <textarea class="lingxi-skill-create__input" id="skillDescription" rows="2" aria-label="技能描述">${draft.description}</textarea>
        <label class="lingxi-skill-create__label" for="skillTrigger">触发场景</label>
        <textarea class="lingxi-skill-create__input" id="skillTrigger" rows="2" aria-label="触发场景">${draft.trigger}</textarea>
        <div class="lingxi-skill-create__actions">
          <button class="lingxi-skill-create__back" type="button">上一步</button>
          <button class="lingxi-skill-create__next" type="button">下一步</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="lingxi-skill-create" data-step="3">
      <div class="lingxi-skill-create__progress">
        <span class="lingxi-skill-create__step is-done">1</span>
        <span class="lingxi-skill-create__line is-done"></span>
        <span class="lingxi-skill-create__step is-done">2</span>
        <span class="lingxi-skill-create__line is-done"></span>
        <span class="lingxi-skill-create__step is-active">3</span>
      </div>
      <p class="lingxi-skill-create__phase">第 3 步 · 确认创建</p>
      <p class="lingxi-skill-create__hint">请确认以下技能信息，确认后将写入技能库。</p>
      <dl class="lingxi-skill-create__preview">
        <div><dt>名称</dt><dd data-field="name"></dd></div>
        <div><dt>需求</dt><dd data-field="requirement"></dd></div>
        <div><dt>描述</dt><dd data-field="description"></dd></div>
        <div><dt>触发场景</dt><dd data-field="trigger"></dd></div>
      </dl>
      <div class="lingxi-skill-create__actions">
        <button class="lingxi-skill-create__back" type="button">上一步</button>
        <button class="lingxi-skill-create__confirm" type="button">确认创建</button>
      </div>
    </div>
  `;
}

export function renderSkillCreateLoadingHtml(statusText, activeStep = 1) {
  const steps = ["解析需求", "生成配置", "写入技能库"];
  const stepsHtml = steps
    .map((label, index) => {
      const stepNum = index + 1;
      let className = "";
      if (activeStep >= 4 || stepNum < activeStep) className = "is-done";
      else if (stepNum === activeStep) className = "is-active";
      return `<li class="${className}">${label}</li>`;
    })
    .join("");

  const isComplete = activeStep >= 4;

  return `
    <div class="lingxi-skill-create lingxi-skill-create--loading${isComplete ? " lingxi-skill-create--done" : ""}">
      <div class="lingxi-skill-create__progress">
        <span class="lingxi-skill-create__step is-done">1</span>
        <span class="lingxi-skill-create__line is-done"></span>
        <span class="lingxi-skill-create__step is-done">2</span>
        <span class="lingxi-skill-create__line is-done"></span>
        <span class="lingxi-skill-create__step ${isComplete ? "is-done" : "is-active"}">3</span>
      </div>
      <p class="lingxi-skill-create__phase">${isComplete ? "创建完成" : "正在创建技能"}</p>
      <div class="lingxi-skill-create__loading-panel">
        ${
          isComplete
            ? '<span class="lingxi-skill-create__check" aria-hidden="true">✓</span>'
            : '<span class="lingxi-skill-create__spinner" aria-hidden="true"></span>'
        }
        <p class="lingxi-skill-create__loading-text">${statusText}</p>
      </div>
      <ol class="lingxi-skill-create__loading-steps">${stepsHtml}</ol>
    </div>
  `;
}

export function mountSkillCreateWizard(container, { draft, onConfirm, onCancel }) {
  const bubble = container.querySelector(".lingxi-chat-item__bubble");
  if (!bubble) return;

  const state = { ...draft };
  let step = 1;

  const readStepValues = () => {
    if (step === 1) {
      state.requirement =
        bubble.querySelector("#skillRequirement")?.value.trim() || state.requirement;
    }
    if (step === 2) {
      state.name = bubble.querySelector("#skillName")?.value.trim() || state.name;
      state.description =
        bubble.querySelector("#skillDescription")?.value.trim() || state.description;
      state.trigger = bubble.querySelector("#skillTrigger")?.value.trim() || state.trigger;
    }
  };

  const fillPreview = () => {
    bubble.querySelector('[data-field="name"]').textContent = state.name;
    bubble.querySelector('[data-field="requirement"]').textContent = state.requirement;
    bubble.querySelector('[data-field="description"]').textContent = state.description;
    bubble.querySelector('[data-field="trigger"]').textContent = state.trigger;
  };

  const render = () => {
    bubble.classList.add("lingxi-chat-item__bubble--form");
    bubble.innerHTML = renderSkillCreateWizardHtml(step, state);
    bind();
    if (step === 3) fillPreview();
    scrollChat();
  };

  const scrollChat = () => {
    container.closest(".lingxi-batch-chat")?.scrollTo({
      top: container.closest(".lingxi-batch-chat").scrollHeight,
    });
  };

  const showLoading = (statusText, activeStep = 1) => {
    bubble.innerHTML = renderSkillCreateLoadingHtml(statusText, activeStep);
    scrollChat();
  };

  const bind = () => {
    bubble.querySelector(".lingxi-skill-create__cancel")?.addEventListener("click", () => {
      onCancel?.();
    });

    bubble.querySelector(".lingxi-skill-create__back")?.addEventListener("click", () => {
      readStepValues();
      step = Math.max(1, step - 1);
      render();
    });

    bubble.querySelector(".lingxi-skill-create__next")?.addEventListener("click", () => {
      readStepValues();
      if (step === 1 && !state.requirement) return;
      if (step === 2 && !state.name) return;
      step = Math.min(3, step + 1);
      render();
    });

    bubble.querySelector(".lingxi-skill-create__confirm")?.addEventListener("click", () => {
      const btn = bubble.querySelector(".lingxi-skill-create__confirm");
      if (btn?.disabled) return;
      btn.disabled = true;
      readStepValues();
      showLoading("正在解析技能需求…", 1);
      onConfirm?.(state, { showLoading });
    });
  };

  render();
}
