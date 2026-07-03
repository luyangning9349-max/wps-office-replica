const MAX_HISTORY = 12;

const conversationHistory = [];

const QA_RULES = [
  {
    test: (q) => /营收|收入|营业收入|业绩/.test(q),
    answer:
      "根据 2025 年年报，公司实现营业收入 **58.62 亿元**，同比增长 **14.2%**。其中个人办公服务收入 32.18 亿元（占比 54.9%），机构办公服务 19.46 亿元（占比 33.2%），互联网广告及其他 6.98 亿元（占比 11.9%）。",
  },
  {
    test: (q) => /净利润|利润|盈利/.test(q),
    answer:
      "2025 年归属于上市公司股东的净利润为 **18.94 亿元**，同比增长 **11.6%**；扣非净利润 **17.52 亿元**，同比增长 **12.2%**。毛利率为 **86.3%**，整体盈利质量保持稳定。",
  },
  {
    test: (q) => /月活|设备|用户/.test(q),
    answer:
      "截至报告期末，WPS Office 全球月活跃设备数达 **6.82 亿台**。个人业务通过会员分层与云增值服务持续提升 ARPU，订阅收入占比进一步提高。",
  },
  {
    test: (q) => /AI|灵犀|人工智能|大模型/.test(q),
    answer:
      "2025 年灵犀大模型能力已深度融入 WPS 365 与个人 Office 产品线，覆盖写作、阅读、分析、演示全链路。AI 助手调用量同比增长超过 **180%**，PDF 场景支持智能目录提取、跨页摘要与扫描件 OCR。",
  },
  {
    test: (q) => /研发|投入|技术/.test(q),
    answer:
      "2025 年研发投入 **12.4 亿元**，占营业收入 **21.2%**。主要方向包括：AI 与大模型（4.86 亿）、云协作与文档中台（3.12 亿）、跨端内核与性能（2.45 亿）、安全与信创适配（1.97 亿）。研发人员占比 **68.3%**。",
  },
  {
    test: (q) => /政企|机构|信创/.test(q),
    answer:
      "机构办公服务业务 2025 年收入 **19.46 亿元**，毛利率 **82.4%**。公司聚焦党政、金融、能源、教育、医疗等行业，新签千万级以上项目数量同比增长 **23%**，并完成多款国产软硬件组合认证。",
  },
  {
    test: (q) => /分红|股东|回购|回报/.test(q),
    answer:
      "2025 年度拟每 10 股派发现金红利 **8.5 元**（含税），合计派息约 **3.92 亿元**。报告期内回购股份 120 万股，回购金额 **1.28 亿元**，持续保持稳定的股东回报政策。",
  },
  {
    test: (q) => /ESG|社会责任|公益/.test(q),
    answer:
      "2025 年公司在 ESG 方面：员工总数 **9,842 人**，女性员工占比 **38.6%**；公益投入 **2,860 万元**；人均培训时长 **46.5 小时**。持续推进绿色办公与「编程进校园」等公益项目。",
  },
  {
    test: (q) => /摘要|总结|概括|要点/.test(q),
    answer:
      "《2025 年金山办公年报》核心要点：\n1. 营收 58.62 亿（+14.2%），净利润 18.94 亿（+11.6%）\n2. 月活设备 6.82 亿，AI 调用量 +180%\n3. 研发投入 12.4 亿，占收入 21.2%\n4. 政企与订阅双轮驱动，毛利率 86.3%\n5. 拟分红 3.92 亿元，回购 1.28 亿元",
  },
  {
    test: (q) => /合同|审查|风险|条款/.test(q),
    answer:
      "针对合同审查，建议重点关注：付款与交付条款、违约责任、知识产权归属、保密义务、争议解决方式及适用法律。如需审查当前 PDF 中的具体合同段落，请选中相关文字后再次提问，我会结合上下文给出针对性意见。",
  },
  {
    test: (q) => /翻译|英文|中文/.test(q),
    answer:
      "我可以帮你翻译当前 PDF 内容。若需全文翻译，建议使用「全文翻译」技能；若只翻译某一段，请选中目标文字后提问「请翻译选中内容」，可获得更精准的结果。",
  },
  {
    test: (q) => /排版|版式|格式/.test(q),
    answer:
      "排版优化建议：统一标题层级与字号、保持页边距一致、表格对齐规范、图片与正文间距适中。当前文档为年报格式，图表页图片可使用「批量调整图片大小」技能统一宽度，使版式更整齐。",
  },
  {
    test: (q) => /海外|境外|国际/.test(q),
    answer:
      "2025 年境外收入合计 **9.36 亿元**（占收入 16.0%），其中亚太地区（不含大陆）4.82 亿（+18.5%），欧美 3.56 亿（+22.1%）。海外市场拓展为重要增长方向之一。",
  },
  {
    test: (q) => /现金流|资金/.test(q),
    answer:
      "2025 年经营活动产生的现金流量净额为 **21.37 亿元**，同比增长 **12.0%**。截至年末，货币资金及交易性金融资产合计 **98.5 亿元**，资产负债率 **24.7%**，财务状况稳健。",
  },
];

function getCurrentPage() {
  const input = document.querySelector(".page-input input, .status-page-input input");
  const page = parseInt(input?.value, 10);
  return Number.isFinite(page) ? page : 1;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAnswer(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

function generateAnswer(question) {
  const q = question.trim();
  if (!q) return "请输入你想了解的问题。";
  if (q.length > 500) return "问题内容过长，请精简后重试。";

  for (const rule of QA_RULES) {
    if (rule.test(q)) {
      const page = getCurrentPage();
      return `${rule.answer}\n\n（已结合当前文档第 ${page} 页上下文）`;
    }
  }

  if (/你好|您好|hello|hi/i.test(q)) {
    return "你好！我是灵犀，可以帮你解读这份《2025 年金山办公年报》。你可以问我营收、利润、AI 进展、研发投入、分红政策等问题。";
  }

  if (/你是谁|你能做什么|能帮我/.test(q)) {
    return "我可以基于当前 PDF 文档为你：\n· 解读财务与经营数据\n· 总结章节要点\n· 回答业务与战略相关问题\n· 辅助合同审查、翻译、排版等办公任务\n\n试试问我「2025 年营收多少」或点击上方推荐卡片。";
  }

  const page = getCurrentPage();
  return `关于「${q.slice(0, 60)}${q.length > 60 ? "…" : ""}」，我在年报中检索到以下相关信息：\n\n公司 2025 年持续推进「云、端、AI」一体化战略，营业收入 58.62 亿元，净利润 18.94 亿元。若需更精确的回答，可尝试提问「营收」「净利润」「AI」「研发」等关键词，或选中 PDF 中的具体段落后提问。\n\n（当前阅读第 ${page} 页）`;
}

function getChatElements() {
  return {
    chat: document.getElementById("lingxiChat"),
    welcome: document.getElementById("lingxiWelcome"),
  };
}

function showChatView() {
  const { chat, welcome } = getChatElements();
  if (!chat) return;
  welcome?.setAttribute("hidden", "");
  chat.hidden = false;
}

function scrollChatToBottom() {
  const { chat } = getChatElements();
  if (chat) chat.scrollTop = chat.scrollHeight;
}

export function appendUserMessage(text) {
  const { chat } = getChatElements();
  if (!chat) return null;

  showChatView();

  const item = document.createElement("div");
  item.className = "lingxi-chat-msg lingxi-chat-msg--user";
  item.innerHTML = `<div class="lingxi-chat-msg__bubble">${escapeHtml(text)}</div>`;
  chat.appendChild(item);
  scrollChatToBottom();
  return item;
}

function appendLoadingMessage() {
  const { chat } = getChatElements();
  if (!chat) return null;

  const item = document.createElement("div");
  item.className = "lingxi-chat-msg lingxi-chat-msg--ai lingxi-chat-msg--loading";
  item.innerHTML = `
    <div class="lingxi-chat-msg__avatar" aria-hidden="true"></div>
    <div class="lingxi-chat-msg__bubble">
      <span class="lingxi-chat-msg__dots"><i></i><i></i><i></i></span>
    </div>
  `;
  chat.appendChild(item);
  scrollChatToBottom();
  return item;
}

function typeAnswer(el, text, onDone) {
  const html = formatAnswer(text);
  let i = 0;
  el.textContent = "";
  const timer = window.setInterval(() => {
    i += 2;
    if (i >= text.length) {
      el.innerHTML = html;
      window.clearInterval(timer);
      onDone?.();
      return;
    }
    el.textContent = text.slice(0, i);
    scrollChatToBottom();
  }, 18);
}

function bindQaFeedback(item) {
  const feedback = item.querySelector(".lingxi-chat-feedback");
  if (!feedback) return;
  feedback.querySelectorAll("[data-feedback]").forEach((btn) => {
    btn.addEventListener("click", () => {
      feedback.querySelectorAll("[data-feedback]").forEach((b) => {
        b.classList.toggle("lingxi-chat-feedback__btn--active", b === btn);
      });
    });
  });
}

function appendAiMessage(text, { typing = true } = {}) {
  const { chat } = getChatElements();
  if (!chat) return null;

  showChatView();

  const item = document.createElement("div");
  item.className = "lingxi-chat-msg lingxi-chat-msg--ai";
  const html = formatAnswer(text);
  item.innerHTML = `
    <div class="lingxi-chat-msg__avatar" aria-hidden="true"></div>
    <div class="lingxi-chat-msg__bubble">
      <div class="lingxi-chat-msg__text"></div>
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
      </div>
    </div>
  `;
  chat.appendChild(item);

  const textEl = item.querySelector(".lingxi-chat-msg__text");
  if (textEl) {
    if (typing) {
      typeAnswer(textEl, text, scrollChatToBottom);
    } else {
      textEl.innerHTML = html;
    }
  }

  bindQaFeedback(item);
  scrollChatToBottom();
  return item;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

let asking = false;

export async function askLingxi(question) {
  const text = question.trim();
  if (!text || asking) return false;

  asking = true;
  appendUserMessage(text);
  conversationHistory.push({ role: "user", content: text });
  if (conversationHistory.length > MAX_HISTORY) conversationHistory.shift();

  const loading = appendLoadingMessage();
  const delay = 600 + Math.min(text.length * 8, 1200);
  await wait(delay);
  loading?.remove();

  const answer = generateAnswer(text);
  appendAiMessage(answer);
  conversationHistory.push({ role: "assistant", content: answer });
  if (conversationHistory.length > MAX_HISTORY) conversationHistory.shift();

  asking = false;
  return true;
}

export function isLingxiAsking() {
  return asking;
}

export function clearLingxiChat() {
  asking = false;
  conversationHistory.length = 0;
  const { chat, welcome } = getChatElements();
  if (chat) {
    chat.innerHTML = "";
    chat.hidden = true;
  }
  welcome?.removeAttribute("hidden");
}
