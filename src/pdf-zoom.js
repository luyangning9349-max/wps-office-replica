const ZOOM_MIN = 25;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;
const ZOOM_PRESETS = [50, 75, 89, 100, 125, 150, 200];

let zoomLevel = 89;

function clampZoom(value) {
  return Math.min(Math.max(Math.round(value), ZOOM_MIN), ZOOM_MAX);
}

function formatZoomLabel(value) {
  return `${value}%`;
}

export function getPdfZoom() {
  return zoomLevel;
}

export function initPdfZoom() {
  const wrap = document.getElementById("pdfPageWrap");
  const slider = document.querySelector(".zoom-slider");
  const zoomValue = document.querySelector(".zoom-value");
  const zoomBtns = document.querySelectorAll(".zoom-btn");
  const zoomDropdown = document.querySelector(".zoom-dropdown");
  const zoomDropdownLabel = zoomDropdown?.querySelector("span");

  if (!wrap) return;

  let menu = null;

  const applyZoom = (value, { silent = false } = {}) => {
    zoomLevel = clampZoom(value);
    wrap.style.zoom = String(zoomLevel / 100);

    if (slider) slider.value = String(zoomLevel);
    if (zoomValue) zoomValue.textContent = formatZoomLabel(zoomLevel);
    if (zoomDropdownLabel) zoomDropdownLabel.textContent = formatZoomLabel(zoomLevel);

    if (!silent) {
      menu?.querySelectorAll("[data-zoom]").forEach((btn) => {
        btn.classList.toggle("zoom-menu__item--active", Number(btn.dataset.zoom) === zoomLevel);
      });
    }
  };

  const closeMenu = () => {
    if (menu) menu.hidden = true;
  };

  const positionMenu = () => {
    if (!menu || !zoomDropdown || menu.hidden) return;

    const rect = zoomDropdown.getBoundingClientRect();
    const menuWidth = menu.offsetWidth || 96;
    const menuHeight = menu.offsetHeight || 220;
    const gap = 4;
    const viewportPadding = 8;

    let top = rect.bottom + gap;
    let left = rect.left;

    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = rect.top - menuHeight - gap;
    }

    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuWidth - viewportPadding;
    }

    left = Math.max(viewportPadding, left);
    top = Math.max(viewportPadding, top);

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.minWidth = `${Math.max(rect.width, 96)}px`;
  };

  const ensureMenu = () => {
    if (menu) return menu;

    menu = document.createElement("div");
    menu.className = "zoom-menu";
    menu.hidden = true;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "缩放比例");

    ZOOM_PRESETS.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zoom-menu__item";
      btn.dataset.zoom = String(preset);
      btn.textContent = formatZoomLabel(preset);
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        applyZoom(preset);
        closeMenu();
      });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    menu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    return menu;
  };

  const openMenu = () => {
    const panel = ensureMenu();
    panel.hidden = false;
    panel.querySelectorAll("[data-zoom]").forEach((btn) => {
      btn.classList.toggle("zoom-menu__item--active", Number(btn.dataset.zoom) === zoomLevel);
    });
    positionMenu();
  };

  const toggleMenu = () => {
    const panel = ensureMenu();
    if (panel.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  };

  zoomBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isZoomOut = btn.getAttribute("aria-label") === "缩小";
      applyZoom(zoomLevel + (isZoomOut ? -ZOOM_STEP : ZOOM_STEP));
    });
  });

  slider?.addEventListener("input", () => {
    applyZoom(Number(slider.value));
  });

  zoomDropdown?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", closeMenu);
  window.addEventListener("resize", closeMenu);
  window.addEventListener("scroll", closeMenu, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
    if (event.ctrlKey && (event.key === "=" || event.key === "+" || event.key === "-")) {
      event.preventDefault();
      applyZoom(zoomLevel + (event.key === "-" ? -ZOOM_STEP : ZOOM_STEP));
    }
  });

  const viewer = document.querySelector(".pdf-viewer");
  viewer?.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return;

      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      applyZoom(zoomLevel + direction * ZOOM_STEP);
    },
    { passive: false }
  );

  applyZoom(zoomLevel, { silent: true });
}
