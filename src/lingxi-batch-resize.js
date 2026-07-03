import { goToPdfPage } from "./pdf-pager.js";

const MIN_SIZE = 80;
const MAX_WIDTH = 536;
const MAX_HEIGHT = 480;

function getAllFigureBoxes() {
  return Array.from(document.querySelectorAll(".report-figure__box")).sort((a, b) => {
    const pageA = Number(a.closest(".report-page")?.dataset.page) || 0;
    const pageB = Number(b.closest(".report-page")?.dataset.page) || 0;
    return pageA - pageB;
  });
}

function getBoxPage(box, fallback = 1) {
  return Number(box.closest(".report-page")?.dataset.page) || fallback;
}

function updateCaption(figure, w, h) {
  const caption = figure.querySelector(".report-figure__caption");
  if (caption) caption.textContent = `${Math.round(w)} × ${Math.round(h)} px`;
  figure.dataset.figW = String(Math.round(w));
  figure.dataset.figH = String(Math.round(h));
}

function constrainProportional(w, h, aspect) {
  let width = w;
  let height = h;

  if (width < MIN_SIZE) {
    width = MIN_SIZE;
    height = width / aspect;
  }
  if (height < MIN_SIZE) {
    height = MIN_SIZE;
    width = height * aspect;
  }
  if (width > MAX_WIDTH) {
    width = MAX_WIDTH;
    height = width / aspect;
  }
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = height * aspect;
  }

  width = Math.min(Math.max(width, MIN_SIZE), MAX_WIDTH);
  height = Math.max(Math.min(height, MAX_HEIGHT), MIN_SIZE);
  return { width, height };
}

function computeTargetWidth(boxes) {
  if (!boxes.length) return 420;

  const avgW = Math.round(boxes.reduce((sum, box) => sum + box.offsetWidth, 0) / boxes.length);
  return Math.min(Math.max(avgW, MIN_SIZE), MAX_WIDTH);
}

function computeTargetHeight(boxes) {
  if (!boxes.length) return 280;

  const avgH = Math.round(boxes.reduce((sum, box) => sum + box.offsetHeight, 0) / boxes.length);
  return Math.min(Math.max(avgH, MIN_SIZE), MAX_HEIGHT);
}

function computeProportionalTargetSize(box, targetWidth) {
  const aspect = box.offsetWidth / box.offsetHeight;
  return constrainProportional(targetWidth, targetWidth / aspect, aspect);
}

function computeProportionalTargetSizeByHeight(box, targetHeight) {
  const aspect = box.offsetWidth / box.offsetHeight;
  return constrainProportional(targetHeight * aspect, targetHeight, aspect);
}

function applyBoxSize(box, width, height) {
  box.style.marginLeft = "0";
  box.style.marginTop = "0";
  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
  updateCaption(box.closest(".report-figure"), width, height);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function resolveTargetSize(boxes, { mode = "fit-width", customSize = 420 } = {}) {
  if (mode === "fit-height") {
    const targetHeight = computeTargetHeight(boxes);
    return {
      mode,
      label: `高度 ${targetHeight} px`,
      getSize: (box) => computeProportionalTargetSizeByHeight(box, targetHeight),
      progressText: `将按统一高度 ${targetHeight} px（保持各图比例）批量调整。`,
      completeText: (count, label) =>
        `已完成！全部 ${count} 张图片已按等比例统一为 ${label}。`,
    };
  }

  const targetWidth =
    mode === "custom"
      ? Math.min(Math.max(Math.round(customSize), MIN_SIZE), MAX_WIDTH)
      : computeTargetWidth(boxes);

  return {
    mode,
    label: `宽度 ${targetWidth} px`,
    getSize: (box) => computeProportionalTargetSize(box, targetWidth),
    progressText:
      mode === "custom"
        ? `将按自定义宽度 ${targetWidth} px（保持各图比例）批量调整。`
        : `AI 推荐统一宽度为 ${targetWidth} px（保持各图比例），开始批量调整。`,
    completeText: (count, label) =>
      `已完成！全部 ${count} 张图片已按等比例统一为 ${label}。`,
  };
}

export async function runBatchImageResize({
  mode = "fit-width",
  customSize = 420,
  onProgress,
  onComplete,
  onError,
} = {}) {
  const boxes = getAllFigureBoxes();
  if (!boxes.length) {
    onError?.();
    return;
  }

  try {
    const plan = resolveTargetSize(boxes, { mode, customSize });

    onProgress?.({ text: `正在分析文档中的 ${boxes.length} 张图片…` });
    await wait(700);

    onProgress?.({
      text: plan.progressText,
      current: 0,
      total: boxes.length,
    });
    await wait(900);

    document.body.classList.add("is-ai-batch-resizing");
    goToPdfPage(getBoxPage(boxes[0], 1));
    await wait(320);

    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      const page = getBoxPage(box, i + 1);
      const imageIndex = i + 1;

      goToPdfPage(page);
      await wait(220);

      onProgress?.({
        text: `正在调整第 ${imageIndex} 张图片…`,
        current: imageIndex,
        total: boxes.length,
      });

      const { width, height } = plan.getSize(box);
      box.classList.add("report-figure__box--ai-resizing");

      await wait(280);
      applyBoxSize(box, width, height);
      await wait(480);

      box.classList.remove("report-figure__box--ai-resizing");
      box.classList.add("report-figure__box--ai-done");
      window.setTimeout(() => box.classList.remove("report-figure__box--ai-done"), 600);
    }

    document.body.classList.remove("is-ai-batch-resizing");
    onComplete?.(plan.completeText(boxes.length, plan.label));
  } catch {
    document.body.classList.remove("is-ai-batch-resizing");
    onError?.();
  }
}

export function getFigureSizes() {
  return getAllFigureBoxes().map((box) => ({
    width: box.offsetWidth,
    height: box.offsetHeight,
  }));
}
