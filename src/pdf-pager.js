import { PAGE_TOTAL, getPdfPages, renderPdfPages } from "./pdf-document.js";
import { initImageResize } from "./image-resize.js";
import { initTextEdit } from "./pdf-text-edit.js";

let pagerApi = null;

export function goToPdfPage(page) {
  pagerApi?.goToPage(page);
}

export function initPdfPager() {
  const wrap = document.getElementById("pdfPageWrap");
  if (!wrap) return;

  renderPdfPages(wrap);
  initImageResize();
  initTextEdit();

  const scrollEl = document.querySelector(".pdf-viewer__scroll");
  const pageInputs = document.querySelectorAll(".page-input input, .status-page-input input");
  const pageTotals = document.querySelectorAll(".page-total, .status-page-input span:last-child");
  const btnFirst = document.querySelector('[data-pager="first"]');
  const btnPrev = document.querySelectorAll('[data-pager="prev"]');
  const btnNext = document.querySelectorAll('[data-pager="next"]');
  const btnLast = document.querySelector('[data-pager="last"]');
  const viewModeBtns = document.querySelectorAll("[data-view-mode]");

  let currentPage = 2;
  let viewMode = "continuous";
  let scrollSyncLocked = false;
  let scrollLockTimer = null;
  let scrollRaf = null;

  pageTotals.forEach((el) => {
    el.textContent = String(PAGE_TOTAL);
  });

  const clampPage = (n) => Math.min(Math.max(n, 1), PAGE_TOTAL);

  const updateInputs = () => {
    pageInputs.forEach((input) => {
      input.value = String(currentPage);
    });
  };

  const lockScrollSync = (ms = 500) => {
    scrollSyncLocked = true;
    clearTimeout(scrollLockTimer);
    scrollLockTimer = window.setTimeout(() => {
      scrollSyncLocked = false;
    }, ms);
  };

  const getVisiblePages = () =>
    [...getPdfPages()].filter((page) => !page.classList.contains("report-page--hidden"));

  const detectPageFromScroll = () => {
    if (!scrollEl) return currentPage;

    const anchor = scrollEl.getBoundingClientRect().top + scrollEl.clientHeight * 0.32;
    let bestPage = currentPage;
    let bestDistance = Infinity;

    getVisiblePages().forEach((page) => {
      const rect = page.getBoundingClientRect();
      const pageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(pageCenter - anchor);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestPage = Number(page.dataset.page);
      }
    });

    return bestPage;
  };

  const scrollToPage = (page) => {
    const target = document.getElementById(`pdf-page-${page}`);
    if (!target || !scrollEl) return;

    const scrollRect = scrollEl.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top = scrollEl.scrollTop + targetRect.top - scrollRect.top - 24;

    lockScrollSync();
    scrollEl.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const applyView = () => {
    const pages = getPdfPages();
    const isSingle = viewMode === "single";

    pages.forEach((page) => {
      const num = Number(page.dataset.page);
      page.classList.toggle("report-page--hidden", isSingle && num !== currentPage);
    });

    scrollEl?.classList.toggle(
      "pdf-viewer__scroll--continuous",
      viewMode === "continuous" || viewMode === "double"
    );
    scrollEl?.classList.toggle("pdf-viewer__scroll--single", viewMode === "single");
  };

  const setCurrentPage = (page, { scroll = false } = {}) => {
    currentPage = clampPage(page);
    updateInputs();
    applyView();
    if (scroll) scrollToPage(currentPage);
  };

  const goToPage = (page, { scroll = true } = {}) => {
    setCurrentPage(page, { scroll });
  };

  const syncPageFromScroll = () => {
    if (scrollSyncLocked || viewMode === "single") return;

    const detected = detectPageFromScroll();
    if (detected !== currentPage) {
      currentPage = detected;
      updateInputs();
    }
  };

  pagerApi = { goToPage };

  btnFirst?.addEventListener("click", () => goToPage(1));
  btnLast?.addEventListener("click", () => goToPage(PAGE_TOTAL));
  btnPrev.forEach((btn) => btn.addEventListener("click", () => goToPage(currentPage - 1)));
  btnNext.forEach((btn) => btn.addEventListener("click", () => goToPage(currentPage + 1)));

  pageInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const value = parseInt(input.value, 10);
      if (Number.isFinite(value)) goToPage(value);
      else updateInputs();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
  });

  viewModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewMode = btn.dataset.viewMode || "single";
      viewModeBtns.forEach((b) => b.classList.toggle("pdf-tool--active", b === btn && b.classList.contains("pdf-tool")));
      viewModeBtns.forEach((b) => b.classList.toggle("status-view-btn--active", b === btn && b.classList.contains("status-view-btn")));
      applyView();
      if (viewMode === "single") scrollToPage(currentPage);
      else syncPageFromScroll();
    });
  });

  scrollEl?.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(syncPageFromScroll);
    },
    { passive: true }
  );

  applyView();
  updateInputs();
  requestAnimationFrame(() => scrollToPage(currentPage));
}
