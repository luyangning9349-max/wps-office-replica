/**
 * WPS PDF viewer — UI interactions
 */
import { initPdfPager } from "./pdf-pager.js";
import { initFloatWidgetController } from "./float-widget-controller.js";
import { initLingxiSidebar } from "./lingxi-sidebar.js";
import { initPdfZoom } from "./pdf-zoom.js";

initPdfPager();
initPdfZoom();
initFloatWidgetController();
initLingxiSidebar();

function initFloatWidget() {
  const widget = document.getElementById("floatWidget");
  if (!widget) return;

  let expandTimer = null;

  const clearExpandTimer = () => {
    if (expandTimer) {
      clearTimeout(expandTimer);
      expandTimer = null;
    }
  };

  const onMouseEnter = () => {
    clearExpandTimer();
    expandTimer = window.setTimeout(() => {
      widget.classList.add("is-expanded");
    }, 400);
  };

  const onMouseLeave = () => {
    clearExpandTimer();
    widget.classList.remove("is-expanded");
  };

  const onHideWidget = () => {
    widget.hidden = true;
  };

  widget.addEventListener("mouseenter", onMouseEnter);
  widget.addEventListener("mouseleave", onMouseLeave);

  widget.querySelector(".float-submenu-item")?.addEventListener("click", onHideWidget);
}

initFloatWidget();
