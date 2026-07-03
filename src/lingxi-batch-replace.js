import { goToPdfPage } from "./pdf-pager.js";
import { EDITABLE_SELECTORS } from "./pdf-editable-config.js";

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getEditableNodes() {
  return Array.from(document.querySelectorAll(EDITABLE_SELECTORS.join(",")));
}

function getNodePage(node, fallback = 1) {
  return Number(node.closest(".report-page")?.dataset.page) || fallback;
}

function countMatches(text, search) {
  if (!search) return 0;
  let count = 0;
  let index = text.indexOf(search);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(search, index + search.length);
  }
  return count;
}

export function collectReplaceOccurrences(search = "2025") {
  const items = [];

  getEditableNodes().forEach((node) => {
    const page = getNodePage(node);
    const total = countMatches(node.textContent, search);
    for (let i = 0; i < total; i += 1) {
      items.push({ node, page });
    }
  });

  return items.sort((a, b) => a.page - b.page);
}

function replaceFirstMatch(node, search, replace) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();

  while (textNode) {
    const content = textNode.textContent;
    const index = content.indexOf(search);
    if (index !== -1) {
      textNode.textContent =
        content.slice(0, index) + replace + content.slice(index + search.length);
      return true;
    }
    textNode = walker.nextNode();
  }

  if (node.textContent.includes(search)) {
    node.textContent = node.textContent.replace(search, replace);
    return true;
  }

  return false;
}

export async function runBatchTextReplace({
  search = "2025",
  replace = "2026",
  onProgress,
  onComplete,
  onError,
} = {}) {
  const occurrences = collectReplaceOccurrences(search);
  if (!occurrences.length) {
    onError?.({ reason: "empty", search });
    return;
  }

  try {
    onProgress?.({
      text: `正在扫描文档中的「${search}」…`,
    });
    await wait(700);

    onProgress?.({
      text: `共发现 ${occurrences.length} 处「${search}」，开始批量替换为「${replace}」。`,
      current: 0,
      total: occurrences.length,
      unit: "处",
    });
    await wait(900);

    document.body.classList.add("is-ai-batch-replacing");
    goToPdfPage(occurrences[0].page);
    await wait(320);

    for (let i = 0; i < occurrences.length; i += 1) {
      const { node, page } = occurrences[i];
      const current = i + 1;

      goToPdfPage(page);
      await wait(220);

      onProgress?.({
        text: `正在替换第 ${current} 处「${search}」…`,
        current,
        total: occurrences.length,
        unit: "处",
      });

      node.classList.add("report-editable--ai-replacing");
      node.scrollIntoView({ block: "center", behavior: "smooth" });
      await wait(280);

      replaceFirstMatch(node, search, replace);
      await wait(480);

      node.classList.remove("report-editable--ai-replacing");
      node.classList.add("report-editable--ai-done");
      window.setTimeout(() => node.classList.remove("report-editable--ai-done"), 600);
    }

    document.body.classList.remove("is-ai-batch-replacing");
    onComplete?.(
      `已完成！全文共替换 ${occurrences.length} 处，将「${search}」统一更新为「${replace}」。`
    );
  } catch {
    document.body.classList.remove("is-ai-batch-replacing");
    onError?.();
  }
}
