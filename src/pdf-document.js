export const PAGE_TOTAL = 26;

const CHART_PAGES = [
  { title: "营业收入持续增长", caption: "2021—2025 年营业收入及同比增速（单位：亿元人民币）", width: 460, height: 280, hue: 8 },
  { title: "月活跃设备规模", caption: "WPS Office 全球月活设备数变化趋势", width: 400, height: 300, hue: 210 },
  { title: "AI 功能渗透率提升", caption: "灵犀等 AI 能力在文档场景中的调用量增长", width: 480, height: 240, hue: 265 },
  { title: "政企客户结构优化", caption: "政企市场签约客户行业分布（2025）", width: 360, height: 320, hue: 145 },
  { title: "海外市场拓展", caption: "境外业务收入及占总收入比重", width: 500, height: 260, hue: 32 },
  { title: "经营性现金流", caption: "近五年经营活动产生的现金流量净额", width: 420, height: 280, hue: 198 },
  { title: "资产负债结构", caption: "2025 年末主要资产与负债构成", width: 380, height: 300, hue: 175 },
];

function buildCoverPage() {
  return `
    <article class="report-page report-page--cover" data-page="1" id="pdf-page-1">
      <div class="report-page__cover">
        <header class="report-header">
          <div class="wps-logo" aria-label="金山办公">
            <span class="wps-logo__mark" aria-hidden="true">WPS</span>
            <span class="wps-logo__text">金山办公</span>
          </div>
          <div class="report-rule report-rule--wps" aria-hidden="true"></div>
        </header>
        <h1 class="report-cover__title report-cover__title--wps">2025 年年度报告</h1>
        <p class="report-cover__subtitle">金山办公软件股份有限公司</p>
        <p class="report-cover__meta">股票代码：688111.SH · 发布日期：2026 年 3 月</p>
        <p class="report-cover__tagline">让智慧绽放</p>
      </div>
    </article>
  `;
}

function buildContentsPage() {
  const entries = [
    ["董事长致辞", "3"],
    ["公司概况与战略定位", "4"],
    ["主要财务数据摘要", "5", "primary"],
    ["2025 年经营成果回顾", "6"],
    ["营业收入趋势分析", "7"],
    ["分业务线经营情况", "8", "primary"],
    ["WPS Office 个人业务", "9"],
    ["月活跃设备与订阅", "10"],
    ["WPS AI 与灵犀能力", "11"],
    ["AI 能力渗透与商业化", "12"],
    ["研发投入与技术创新", "13", "primary"],
    ["政企市场与行业方案", "14"],
    ["政企客户行业分布", "15"],
    ["地区收入与海外拓展", "16", "primary"],
    ["境外市场增长情况", "17"],
    ["公司治理与董事会", "18"],
    ["董事、监事及高管", "19", "primary"],
    ["ESG 与社会责任", "20"],
    ["ESG 关键绩效指标", "21", "primary"],
    ["现金流与资本配置", "22"],
    ["资产负债与偿债能力", "23"],
    ["未来展望与风险提示", "24"],
    ["股东回报与分红政策", "25"],
    ["附录与免责声明", "26"],
  ];

  const tocHtml = entries
    .map(([title, page, level]) => {
      const cls = level === "primary" ? "toc-entry toc-entry--primary" : "toc-entry";
      return `<div class="${cls}"><span class="toc-title">${title}</span><span class="toc-leader" aria-hidden="true"></span><span class="toc-page">${page}</span></div>`;
    })
    .join("");

  return `
    <article class="report-page" data-page="2" id="pdf-page-2">
      <header class="report-header">
        <div class="wps-logo" aria-label="金山办公">
          <span class="wps-logo__mark" aria-hidden="true">WPS</span>
          <span class="wps-logo__text">金山办公</span>
        </div>
        <div class="report-rule report-rule--wps" aria-hidden="true"></div>
        <p class="report-subtitle">2025 年年度报告 · 目录</p>
      </header>
      <h1 class="contents-title contents-title--wps">目录</h1>
      <nav class="toc" aria-label="目录">${tocHtml}</nav>
    </article>
  `;
}

function buildPageHeader(pageNum) {
  return `
    <header class="report-page__mini-header">
      <span class="report-page__mini-brand">金山办公 · 2025 年报</span>
      <span class="report-page__mini-num">${pageNum}</span>
    </header>
  `;
}

function buildProse(paragraphs) {
  return `<div class="report-prose">${paragraphs.map((p) => `<p>${p}</p>`).join("")}</div>`;
}

function buildKpiGrid(items) {
  return `
    <div class="report-kpi-grid">
      ${items
        .map(
          ([label, value, note]) => `
        <div class="report-kpi">
          <div class="report-kpi__value">${value}</div>
          <div class="report-kpi__label">${label}</div>
          ${note ? `<div class="report-kpi__note">${note}</div>` : ""}
        </div>`
        )
        .join("")}
    </div>
  `;
}

function buildTable(headers, rows, caption = "") {
  return `
    ${caption ? `<p class="report-table__caption">${caption}</p>` : ""}
    <div class="report-table-wrap">
      <table class="report-table">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function buildTextPage(pageNum, title, bodyHtml, { lead = "" } = {}) {
  return `
    <article class="report-page report-page--content" data-page="${pageNum}" id="pdf-page-${pageNum}">
      ${buildPageHeader(pageNum)}
      <h2 class="report-page__section-title">${title}</h2>
      ${lead ? `<p class="report-page__lead">${lead}</p>` : ""}
      ${bodyHtml}
    </article>
  `;
}

function buildIllustrationSvg(pageNum, width, height, hue) {
  const c1 = `hsl(${hue} 62% 58%)`;
  const c2 = `hsl(${(hue + 40) % 360} 55% 72%)`;
  const c3 = `hsl(${(hue + 80) % 360} 48% 42%)`;
  const barCount = 5 + (pageNum % 4);

  const bars = Array.from({ length: barCount }, (_, i) => {
    const barH = 40 + ((pageNum * 17 + i * 31) % 120);
    const x = 40 + i * ((width - 80) / barCount);
    const w = Math.max(24, (width - 100) / barCount - 8);
    return `<rect x="${x}" y="${height - barH - 30}" width="${w}" height="${barH}" rx="4" fill="${c2}" opacity="0.9"/>`;
  }).join("");

  return `
    <svg class="report-figure__svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="第 ${pageNum} 页图表">
      <defs>
        <linearGradient id="bg-${pageNum}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${c2}" stop-opacity="0.32"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="10" fill="url(#bg-${pageNum})"/>
      <circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.min(width, height) * 0.12}" fill="${c1}" opacity="0.35"/>
      <path d="M24 ${height * 0.28} Q ${width * 0.5} ${height * 0.12}, ${width - 24} ${height * 0.32}" fill="none" stroke="${c3}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      ${bars}
      <text x="24" y="28" fill="${c3}" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="13" font-weight="600">图表 ${pageNum - 2}</text>
    </svg>
  `;
}

const HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

function buildResizeHandles() {
  return `
    <div class="report-figure__handles" aria-hidden="true">
      ${HANDLES.map((dir) => `<span class="report-figure__handle report-figure__handle--${dir}" data-handle="${dir}"></span>`).join("")}
    </div>
  `;
}

function buildImagePage(pageNum, meta) {
  const { title, caption, width, height, hue } = meta;
  return `
    <article class="report-page report-page--image" data-page="${pageNum}" id="pdf-page-${pageNum}">
      ${buildPageHeader(pageNum)}
      <h2 class="report-page__section-title">${title}</h2>
      <p class="report-page__section-caption">${caption}</p>
      <figure class="report-figure" data-fig-w="${width}" data-fig-h="${height}">
        <div class="report-figure__box" style="width:${width}px;height:${height}px" tabindex="0" role="button" aria-label="图片，点击选中后可拖动边缘调整大小">
          ${buildIllustrationSvg(pageNum, width, height, hue)}
          ${buildResizeHandles()}
        </div>
        <figcaption class="report-figure__caption">${width} × ${height} px</figcaption>
      </figure>
      ${buildProse([
        "上图展示了公司在本报告期内的核心经营指标变化。数据来源于经审计的财务报表及内部经营分析系统，部分指标已做同口径调整以便比较。",
      ])}
    </article>
  `;
}

function buildContentPages() {
  const pages = [];

  pages.push(
    buildTextPage(
      3,
      "董事长致辞",
      buildProse([
        "尊敬的各位股东、合作伙伴与用户：2025 年是金山办公深化「AI 2.0」战略、推动产品智能化升级的关键一年。面对宏观环境波动与行业竞争加剧，公司坚持「用户至上、技术驱动、开放协同」的经营理念，实现了收入与利润的稳健增长。",
        "报告期内，WPS Office 全球月活设备数再创新高，个人订阅与政企授权双轮驱动效应持续显现。灵犀大模型能力全面融入文档、表格、演示与 PDF 场景，AI 助手调用量同比增长超过 180%，用户创作效率显著提升。",
        "我们坚信，办公软件正在从「工具」进化为「智能工作平台」。金山办公将继续加大研发投入，完善云协作与行业解决方案，与全球用户和伙伴共建高效、安全、可信赖的数字办公生态。感谢每一位股东长期以来的信任与支持。",
      ]),
      { lead: "坚持 AI 驱动，迈向智能办公新阶段" }
    )
  );

  pages.push(
    buildTextPage(
      4,
      "公司概况与战略定位",
      `
      ${buildProse([
        "金山办公是国内领先的办公软件和服务提供商，主要产品包括 WPS Office、金山文档、WPS 365 及面向政企的行业办公解决方案。公司致力于为全球用户提供跨平台、跨终端的一站式办公服务。",
        "2025 年，公司持续推进「云、端、AI」一体化战略：在个人市场强化订阅价值与会员体系；在政企市场深耕金融、政务、教育、医疗等重点行业；在海外市场加快本地化运营与渠道建设。",
      ])}
      ${buildKpiGrid([
        ["营业收入", "58.6 亿元", "同比 +14.2%"],
        ["归母净利润", "18.9 亿元", "同比 +11.6%"],
        ["研发投入", "12.4 亿元", "占收入 21.2%"],
        ["月活设备", "6.82 亿", "全球累计"],
      ])}
    `
    )
  );

  pages.push(
    buildTextPage(
      5,
      "主要财务数据摘要",
      buildTable(
        ["项目", "2025 年", "2024 年", "同比变动"],
        [
          ["营业收入（亿元）", "58.62", "51.32", "+14.2%"],
          ["归属于上市公司股东的净利润（亿元）", "18.94", "16.98", "+11.6%"],
          ["归属于上市公司股东的扣非净利润（亿元）", "17.52", "15.61", "+12.2%"],
          ["经营活动现金流量净额（亿元）", "21.37", "19.08", "+12.0%"],
          ["基本每股收益（元/股）", "4.10", "3.68", "+11.4%"],
          ["加权平均净资产收益率", "19.8%", "18.6%", "+1.2 pct"],
        ],
        "表 1：近三年主要会计数据和财务指标（节选）"
      )
    )
  );

  pages.push(
    buildTextPage(
      6,
      "2025 年经营成果回顾",
      buildProse([
        "报告期内，公司实现营业收入 58.62 亿元，同比增长 14.2%。个人办公服务业务保持韧性，订阅收入占比进一步提升；机构办公服务业务受益于信创深化与行业数字化改造，订单交付节奏加快；互联网广告及其他业务在精细化运营下保持平稳。",
        "毛利率为 86.3%，同比基本持平，体现了公司产品型业务的规模效应。销售费用率与管理费用率整体可控，研发费用率维持在 21% 以上，为 AI 大模型训练、多模态理解与跨端协同提供持续保障。",
        "截至 2025 年 12 月 31 日，公司货币资金及交易性金融资产合计 98.5 亿元，资产负债率 24.7%，财务状况稳健，具备持续分红与战略投资能力。",
      ]),
      { lead: "收入利润双增长，经营质量持续改善" }
    )
  );

  // page 7 = chart
  pages.push(
    buildTextPage(
      8,
      "分业务线经营情况",
      buildTable(
        ["业务板块", "营业收入（亿元）", "收入占比", "毛利率"],
        [
          ["个人办公服务", "32.18", "54.9%", "89.1%"],
          ["机构办公服务", "19.46", "33.2%", "82.4%"],
          ["互联网广告及其他", "6.98", "11.9%", "71.6%"],
          ["合计", "58.62", "100.0%", "86.3%"],
        ],
        "表 2：2025 年分业务营业收入构成"
      )
    )
  );

  pages.push(
    buildTextPage(
      9,
      "WPS Office 个人业务",
      buildProse([
        "个人业务以 WPS Office 为核心，覆盖 Windows、macOS、Linux、Android、iOS 及鸿蒙等多端场景。2025 年，公司通过会员权益分层、模板资源与云空间增值服务，持续提升 ARPU 与续费率。",
        "产品体验方面，全新界面设计语言在移动端率先落地，文档打开速度与协作稳定性进一步优化。PDF 阅读编辑、图片处理、格式转换等高频工具矩阵更加完善，交叉使用场景显著增加。",
        "年轻用户群体对 AI 写作、智能排版、长文档摘要等功能反馈积极，带动超级会员渗透率提升。公司将持续丰富内容生态，与更多知识服务伙伴共建模板与课程市场。",
      ])
    )
  );

  // page 10 chart
  pages.push(
    buildTextPage(
      11,
      "WPS AI 与灵犀能力",
      buildProse([
        "2025 年，公司将灵犀大模型能力深度融入 WPS 365 与个人 Office 产品线，形成覆盖写作、阅读、分析、演示全链路的 AI 助手。用户可通过自然语言完成提纲生成、合同条款比对、表格公式解释、幻灯片一键美化等任务。",
        "在 PDF 场景，灵犀支持智能目录提取、跨页摘要、扫描件 OCR 与版式还原，显著降低政企用户文档处理成本。AI 感知能力可主动识别用户重复操作并推荐批量处理技能，提升专业场景效率。",
        "公司坚持「可控、安全、可审计」的 AI 部署原则，为政企客户提供私有化与混合云方案，满足数据不出域与合规审计要求。",
      ]),
      { lead: "从辅助工具到智能工作伙伴" }
    )
  );

  // page 12 chart
  pages.push(
    buildTextPage(
      13,
      "研发投入与技术创新",
      buildTable(
        ["研发方向", "2025 年投入（亿元）", "占比", "主要成果"],
        [
          ["AI 与大模型", "4.86", "39.2%", "灵犀 2.0、多模态理解"],
          ["云协作与文档中台", "3.12", "25.2%", "WPS 365 行业模板"],
          ["跨端内核与性能", "2.45", "19.8%", "鸿蒙原生、低内存优化"],
          ["安全与信创适配", "1.97", "15.8%", "国密算法、涉密版本"],
          ["合计", "12.40", "100.0%", "—"],
        ],
        "表 3：2025 年研发费用分方向列示"
      )
    )
  );

  pages.push(
    buildTextPage(
      14,
      "政企市场与行业方案",
      buildProse([
        "机构办公服务业务聚焦党政、金融、能源、教育、医疗等重点行业，提供「端+云+文档中台+AI」一体化解决方案。2025 年新签千万级以上项目数量同比增长 23%，行业标杆案例在区域市场形成示范效应。",
        "信创适配方面，公司完成多款主流国产芯片、操作系统与数据库组合认证，WPS 365 政企版在涉密、专网环境部署经验持续积累。文档安全能力覆盖权限分级、水印溯源、外发审批与日志审计。",
        "针对大型组织协同痛点，公司推出统一身份认证、组织架构同步、流程表单与知识库联动能力，帮助客户构建可持续运营的数字化办公平台。",
      ])
    )
  );

  // page 15 chart
  pages.push(
    buildTextPage(
      16,
      "地区收入与海外拓展",
      buildTable(
        ["地区", "营业收入（亿元）", "收入占比", "同比增速"],
        [
          ["中国大陆", "49.26", "84.0%", "+12.8%"],
          ["亚太地区（不含大陆）", "4.82", "8.2%", "+18.5%"],
          ["欧洲及美洲", "3.56", "6.1%", "+22.1%"],
          ["其他", "0.98", "1.7%", "+15.4%"],
          ["合计", "58.62", "100.0%", "+14.2%"],
        ],
        "表 4：2025 年分地区营业收入"
      )
    )
  );

  // page 17 chart
  pages.push(
    buildTextPage(
      18,
      "公司治理与董事会",
      buildProse([
        "公司严格按照《公司法》《证券法》《上市公司治理准则》等法律法规及《公司章程》要求，建立健全股东大会、董事会、监事会与经营管理层「三会一层」治理结构，确保决策科学、执行有力、监督有效。",
        "董事会下设战略委员会、审计委员会、提名委员会与薪酬与考核委员会，在重大投资、关联交易、财务报告、高管选聘与激励等方面发挥专业作用。2025 年董事会共召开 11 次会议，审议议案 47 项。",
        "公司持续完善内部控制体系，开展覆盖主要业务流程的内控评价与整改，未发现财务报告内部控制重大缺陷。信息披露工作获得上交所年度评价 A 级。",
      ])
    )
  );

  pages.push(
    buildTextPage(
      19,
      "董事、监事及高级管理人员",
      buildTable(
        ["姓名", "职务", "性别", "年龄", "任职起始"],
        [
          ["邹涛", "董事长", "男", "42", "2023-06"],
          ["章庆元", "董事、首席执行官", "男", "48", "2011-12"],
          ["张磊", "董事、高级副总裁", "男", "45", "2019-03"],
          ["王宇", "独立董事", "男", "56", "2022-05"],
          ["陈曦", "监事会主席", "女", "44", "2020-08"],
          ["刘洋", "财务总监", "男", "41", "2021-01"],
        ],
        "表 5：现任董事、监事及高级管理人员（节选）"
      )
    )
  );

  pages.push(
    buildTextPage(
      20,
      "ESG 与社会责任",
      buildProse([
        "公司积极践行环境、社会与治理（ESG）理念，将可持续发展融入战略规划与日常经营。在环境保护方面，推进绿色数据中心建设，优化客户端能耗，鼓励无纸化办公与远程协作，减少差旅碳排放。",
        "在社会贡献方面，公司持续开展「编程进校园」「乡村教师数字素养培训」等公益项目，累计惠及师生超过 120 万人次。员工关怀方面，完善多元化招聘、培训发展与职业健康保障体系，女性员工占比 38.6%。",
        "公司治理方面，公司强化商业道德与反腐败培训，建立供应商 ESG 评估机制，推动产业链协同履责。",
      ])
    )
  );

  pages.push(
    buildTextPage(
      21,
      "ESG 关键绩效指标",
      buildTable(
        ["指标", "单位", "2025 年", "2024 年"],
        [
          ["员工总数", "人", "9,842", "9,156"],
          ["研发人员占比", "%", "68.3", "67.1"],
          ["公益投入", "万元", "2,860", "2,420"],
          ["人均培训时长", "小时", "46.5", "42.0"],
          ["因工亡故人数", "人", "0", "0"],
          ["董事会独立性（独立董事占比）", "%", "37.5", "37.5"],
        ],
        "表 6：ESG 与社会责任关键指标"
      )
    )
  );

  // pages 22-23 charts
  pages.push(
    buildTextPage(
      24,
      "未来展望与风险提示",
      buildProse([
        "展望 2026 年，公司将继续深化 AI 原生办公战略，推动灵犀能力从「辅助创作」走向「任务闭环」，在文档生成、数据分析、流程自动化等场景形成差异化竞争力。",
        "个人市场将加强会员分层与国际化运营；政企市场将聚焦大型行业客户复制与订阅化转型；海外市场将优化本地化团队与渠道伙伴体系，提升品牌认知与付费转化。",
        "风险方面，需关注宏观经济波动、行业竞争加剧、AI 技术迭代、知识产权纠纷、数据安全与隐私合规等因素可能对公司经营产生影响。公司将加强风险识别与应对机制，保障长期稳健发展。",
      ]),
      { lead: "把握 AI 机遇，稳健应对不确定性" }
    )
  );

  pages.push(
    buildTextPage(
      25,
      "股东回报与分红政策",
      `
      ${buildProse([
        "公司高度重视股东回报，在保证业务发展与研发投入的前提下，保持持续、稳定的现金分红政策。2025 年度拟向全体股东每 10 股派发现金红利 8.5 元（含税），合计派息约 3.92 亿元。",
        "报告期内，公司回购股份 120 万股，回购金额 1.28 亿元，用于员工持股计划与股权激励，进一步绑定核心人才与公司长期价值。",
      ])}
      ${buildTable(
        ["年度", "现金分红（亿元）", "回购金额（亿元）", "分红+回购合计"],
        [
          ["2025", "3.92", "1.28", "5.20"],
          ["2024", "3.48", "0.96", "4.44"],
          ["2023", "3.12", "0.80", "3.92"],
        ],
        "表 7：近三年股东回报情况"
      )}
    `
    )
  );

  pages.push(
    buildTextPage(
      26,
      "附录与免责声明",
      buildProse([
        "本报告所载财务数据及经营讨论分析均基于中国会计准则编制，并经德勤华永会计师事务所（特殊普通合伙）审计。报告中涉及的前瞻性陈述不构成公司对投资者的实质承诺，敬请投资者注意投资风险。",
        "报告中所引用的第三方数据、行业排名及市场份额信息来自公开资料或行业研究机构，公司不对其准确性作额外保证。如需完整财务报表附注、关联交易详情及募集资金使用情况，请查阅公司于上交所网站披露的 PDF 全文版本。",
        "联系方式：投资者关系部 · ir@wps.cn · 北京市海淀区小营西路 33 号金山软件大厦",
      ])
    )
  );

  return pages;
}

function buildAllPages() {
  const pages = [buildCoverPage(), buildContentsPage()];
  const contentPages = buildContentPages();

  const chartPageNums = [7, 10, 12, 15, 17, 22, 23];
  let contentIndex = 0;
  let chartIndex = 0;

  for (let pageNum = 3; pageNum <= PAGE_TOTAL; pageNum += 1) {
    if (chartPageNums.includes(pageNum)) {
      pages.push(buildImagePage(pageNum, CHART_PAGES[chartIndex]));
      chartIndex += 1;
    } else {
      pages.push(contentPages[contentIndex]);
      contentIndex += 1;
    }
  }

  return pages;
}

export function renderPdfPages(container) {
  if (!container) return;
  container.innerHTML = `<div class="pdf-pages" id="pdfPagesInner">${buildAllPages().join("")}</div>`;
}

export function getPdfPages() {
  return document.querySelectorAll(".report-page[data-page]");
}
