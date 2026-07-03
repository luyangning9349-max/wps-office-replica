import { onImageResizeComplete } from "./float-widget-controller.js";

const MIN_SIZE = 80;
const MAX_WIDTH = 536;
const DRAG_THRESHOLD = 4;

const HANDLE_CURSORS = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

function getBoxMargins(box) {
  const style = getComputedStyle(box);
  return {
    marginLeft: parseFloat(style.marginLeft) || 0,
    marginTop: parseFloat(style.marginTop) || 0,
  };
}

function clampBoxPosition(box, marginLeft, marginTop) {
  const page = box.closest(".report-page");
  if (!page) return { marginLeft, marginTop };

  const root = getComputedStyle(document.documentElement);
  const padX = parseFloat(root.getPropertyValue("--page-padding-x")) || 72;
  const padY = parseFloat(root.getPropertyValue("--page-padding-y")) || 56;
  const maxLeft = Math.max(0, page.clientWidth - padX * 2 - box.offsetWidth);
  const maxTop = Math.max(0, page.clientHeight - padY - 120 - box.offsetHeight);

  return {
    marginLeft: Math.min(Math.max(marginLeft, 0), maxLeft),
    marginTop: Math.min(Math.max(marginTop, 0), maxTop),
  };
}

export function initImageResize() {
  const viewer = document.querySelector(".pdf-viewer");
  if (!viewer) return;

  let activeBox = null;
  let resizing = false;
  let dragging = false;
  let dragStarted = false;
  let handleDir = "";
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;
  let startMarginLeft = 0;
  let startMarginTop = 0;
  let captureTarget = null;

  const deselectAll = () => {
    document.querySelectorAll(".report-figure__box.is-selected").forEach((box) => {
      box.classList.remove("is-selected");
    });
    activeBox = null;
  };

  const selectBox = (box) => {
    deselectAll();
    activeBox = box;
    box.classList.add("is-selected");
    box.focus();
  };

  const updateCaption = (figure, w, h) => {
    const caption = figure?.querySelector(".report-figure__caption");
    if (caption) {
      caption.textContent = `${Math.round(w)} × ${Math.round(h)} px`;
    }
    if (figure) {
      figure.dataset.figW = String(Math.round(w));
      figure.dataset.figH = String(Math.round(h));
    }
  };

  const constrainProportional = (w, h, aspect) => {
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

    width = Math.min(Math.max(width, MIN_SIZE), MAX_WIDTH);
    height = Math.max(height, MIN_SIZE);
    return { width, height };
  };

  const lockAspectSize = (w, h, aspect, isCorner) => {
    if (isCorner) {
      const relW = Math.abs(w - startW) / startW;
      const relH = Math.abs(h - startH) / startH;
      if (relW >= relH) {
        return constrainProportional(w, w / aspect, aspect);
      }
      return constrainProportional(h * aspect, h, aspect);
    }

    if (handleDir === "e" || handleDir === "w") {
      return constrainProportional(w, w / aspect, aspect);
    }

    return constrainProportional(h * aspect, h, aspect);
  };

  const releaseCapture = (event) => {
    if (captureTarget?.hasPointerCapture?.(event.pointerId)) {
      captureTarget.releasePointerCapture(event.pointerId);
    }
    captureTarget = null;
  };

  const onPointerDownHandle = (event) => {
    const handle = event.target.closest("[data-handle]");
    if (!handle) return;

    const box = handle.closest(".report-figure__box");
    if (!box) return;

    event.preventDefault();
    event.stopPropagation();

    selectBox(box);
    resizing = true;
    dragging = false;
    dragStarted = false;
    handleDir = handle.dataset.handle;
    startX = event.clientX;
    startY = event.clientY;
    startW = box.offsetWidth;
    startH = box.offsetHeight;
    ({ marginLeft: startMarginLeft, marginTop: startMarginTop } = getBoxMargins(box));

    document.body.classList.add("is-resizing-figure");
    captureTarget = handle;
    handle.setPointerCapture(event.pointerId);
  };

  const onPointerDownBox = (event) => {
    const box = event.target.closest(".report-figure__box");
    if (!box || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    selectBox(box);
    dragging = true;
    dragStarted = false;
    resizing = false;
    startX = event.clientX;
    startY = event.clientY;
    ({ marginLeft: startMarginLeft, marginTop: startMarginTop } = getBoxMargins(box));

    document.body.classList.add("is-dragging-figure");
    captureTarget = box;
    box.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (dragging && activeBox) {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (!dragStarted) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        dragStarted = true;
      }

      const next = clampBoxPosition(activeBox, startMarginLeft + dx, startMarginTop + dy);
      activeBox.style.marginLeft = `${next.marginLeft}px`;
      activeBox.style.marginTop = `${next.marginTop}px`;
      return;
    }

    if (!resizing || !activeBox) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const aspect = startW / startH;
    const isCorner = handleDir.length === 2;
    let w = startW;
    let h = startH;

    if (handleDir.includes("e")) w = startW + dx;
    if (handleDir.includes("w")) w = startW - dx;
    if (handleDir.includes("s")) h = startH + dy;
    if (handleDir.includes("n")) h = startH - dy;

    const { width, height } = lockAspectSize(w, h, aspect, isCorner);

    activeBox.style.width = `${width}px`;
    activeBox.style.height = `${height}px`;

    let marginLeft = startMarginLeft;
    let marginTop = startMarginTop;

    if (handleDir.includes("w")) {
      marginLeft = startMarginLeft + (startW - width);
    } else if (!isCorner && (handleDir === "e" || handleDir === "s" || handleDir === "n")) {
      marginLeft = startMarginLeft + (startW - width) / 2;
    }

    if (handleDir.includes("n")) {
      marginTop = startMarginTop + (startH - height);
    } else if (!isCorner && (handleDir === "s" || handleDir === "e" || handleDir === "w")) {
      marginTop = startMarginTop + (startH - height) / 2;
    }

    const next = clampBoxPosition(activeBox, marginLeft, marginTop);
    activeBox.style.marginLeft = `${next.marginLeft}px`;
    activeBox.style.marginTop = `${next.marginTop}px`;

    updateCaption(activeBox.closest(".report-figure"), width, height);
  };

  const onPointerUp = (event) => {
    if (dragging) {
      const box = activeBox;
      const moved =
        dragStarted &&
        box &&
        (Math.abs(getBoxMargins(box).marginLeft - startMarginLeft) > 2 ||
          Math.abs(getBoxMargins(box).marginTop - startMarginTop) > 2);

      dragging = false;
      dragStarted = false;
      document.body.classList.remove("is-dragging-figure");
      releaseCapture(event);

      if (moved) {
        onImageResizeComplete();
      }
      return;
    }

    if (!resizing) return;

    const box = activeBox;
    const changed =
      box &&
      (Math.abs(box.offsetWidth - startW) > 2 || Math.abs(box.offsetHeight - startH) > 2);

    resizing = false;
    handleDir = "";
    document.body.classList.remove("is-resizing-figure");
    releaseCapture(event);

    if (changed) {
      onImageResizeComplete();
    }
  };

  viewer.addEventListener("click", (event) => {
    if (event.target.closest(".report-figure__box")) return;
    if (!event.target.closest(".report-figure__handle")) {
      deselectAll();
    }
  });

  viewer.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-handle]")) {
      onPointerDownHandle(event);
      return;
    }
    if (event.target.closest(".report-figure__box")) {
      onPointerDownBox(event);
    }
  });

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") deselectAll();
  });

  document.querySelectorAll(".report-figure__handle").forEach((handle) => {
    const dir = handle.dataset.handle;
    if (dir && HANDLE_CURSORS[dir]) {
      handle.style.cursor = HANDLE_CURSORS[dir];
    }
  });
}
