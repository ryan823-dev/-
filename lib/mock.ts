
import { KnowledgeCard, ContentAsset, ClientAction, NavItem, Lead, ReportData } from '../types';

export const knowledgeCards: KnowledgeCard[] = [
  {
    id: 'k-td-1',
    type: 'Company',
    title: '涂豆科技 (tdpaintcell) 企业画像',
    fields: [
      { fieldKey: 'name', label: '企业名称', value: '涂豆科技' },
      { fieldKey: 'positioning', label: '品牌定位', value: '喷涂机器人自动化集成专家' },
      { fieldKey: 'delivery_process', label: '交付流程', value: '评估→仿真→集成→调试→验收' },
      { fieldKey: 'certifications', label: '核心认证', value: 'ISO9001, ATEX防爆认证, VOC排放达标认证' }
    ],
    completion: 90,
    confidence: 98,
    missingFields: [],
    evidence: [{ sourceId: 'src-1', sourceName: '涂豆科技企业白皮书_2024.pdf' }]
  },
  {
    id: 'k-td-2',
    type: 'Offering',
    title: '智能喷涂机器人工作站 (Paint Station X)',
    fields: [
      { fieldKey: 'application', label: '适用工件', value: '工程机械覆盖件、钢结构件' },
      { fieldKey: 'gun_type', label: '喷枪类型', value: '高转速旋杯/静电喷枪' },
      { fieldKey: 'color_change', label: '换色系统', value: '15秒快速换色模块' },
      { fieldKey: 'voc_status', label: 'VOC合规性', value: '集成废气回收净化接口' }
    ],
    completion: 75,
    confidence: 94,
    missingFields: [
      { fieldKey: 'cycle_time', label: '典型节拍范围', reason: '不同工件差异较大，需补齐标准件参考数据', impact: '影响选型手册的对比维度' },
      { fieldKey: 'max_part_size', label: '最大兼容工件尺寸', reason: '说明书中仅标注了机械臂臂长', impact: '影响客户初筛匹配度' }
    ],
    evidence: [{ sourceId: 'src-2', sourceName: 'PaintStationX_技术手册.docx' }]
  }
];

export const generateClientActions = (): ClientAction[] => {
  return [
    {
      id: 'act-1',
      type: '资料补齐',
      priority: 'P0',
      status: '待处理',
      sourceModule: '专业知识引擎',
      title: '补齐“典型节拍/工件尺寸”关键参数',
      reason: '在生成选型指南时发现关键节拍或尺寸参数缺失，导致生成内容缺乏专业说服力。',
      impact: '影响 2 项选型指南生成的专业对比维度，预估提升可信度 40%',
      required: ['典型节拍范围', '最大兼容工件尺寸'],
      suggested: '参考《PaintStationX_技术手册》第12页',
      evidence: '依据：Marketing Composer Engine 智能识别',
      ctaLabel: '去补齐资料',
      ctaRoute: `${NavItem.KnowledgeEngine}?actionId=act-1&focus=missingField&field=cycle_time`
    },
    {
      id: 'act-2',
      type: '内容共创',
      priority: 'P0',
      status: '待处理',
      sourceModule: '营销驱动系统',
      title: '确认《选型指南》核心术语口径',
      reason: 'AI 识别到多处术语混用（喷房/喷涂房/喷漆房），需甲方统一全球化口径。',
      impact: '阻塞内容发布，统一口径可提升 SEO 权重 15%',
      evidence: '依据：营销驱动系统状态 (待共创)',
      ctaLabel: '去共创校正',
      ctaRoute: `${NavItem.MarketingDrive}?actionId=act-2&tab=cocreation&highlight=para_3`
    },
    {
      id: 'act-3',
      type: '授权接入',
      priority: 'P1',
      status: '待处理',
      sourceModule: '海外声量中台',
      title: 'LinkedIn 企业账号授权接入',
      reason: 'LinkedIn 接口授权未完成，导致自动排程任务处于挂起状态。',
      impact: '导致 LinkedIn 自动化发布暂停，降低本周社媒互动增长 22%',
      evidence: '依据：海外声量中台接入状态 (OpsState)',
      ctaLabel: '去接入',
      ctaRoute: `${NavItem.SocialPresence}?actionId=act-3&focus=auth&channel=linkedin`
    },
    {
      id: 'act-4',
      type: '方向拍板',
      priority: 'P1',
      status: '待处理',
      sourceModule: '出海获客雷达',
      title: '欧洲市场主推行业优先级确认',
      reason: '目前识别到“工程机械”与“钢结构”均有高匹配线索，需确认首发主推方向。',
      impact: '影响下周扫街任务的权重分配与内容个性化程度',
      required: ['目标市场', '主推行业'],
      ctaLabel: '选择方向',
      ctaRoute: `${NavItem.OutreachRadar}?actionId=act-4&focus=decision&key=targetIndustry`
    },
    {
      id: 'act-5',
      type: '回执记录',
      priority: 'P2',
      status: '已完成',
      sourceModule: '专业知识引擎',
      title: '已采纳纠错并回填字段',
      reason: '甲方已完成“换色时间”字段的纠错校正（15s -> 12.5s）。',
      impact: '数据已同步至 OfferingCard 字段，后续生成将采用最新真值',
      completedAt: '2024-03-25 14:20',
      resultSummary: '采纳纠错 1 条，同步至 3 个内容资产',
      ctaLabel: '回看原对象',
      ctaRoute: `${NavItem.KnowledgeEngine}?actionId=act-5`
    }
  ];
};

export const contentAssets: ContentAsset[] = [
  {
    id: 'ca-td-1',
    title: '2024 Robotic Paint Cell Selection Guide',
    category: 'Selection Guide',
    status: '待确认',
    knowledgeRefs: ['k-td-1', 'k-td-2'],
    keywords: ['paint robot', 'selection guide', 'TD Robotics', 'automated coating'],
    lastModified: '2024-03-24',
    draftBody: `Selecting the right robotic paint cell is the first step toward achieving coating automation. This guide will help procurement decision-makers quickly match the optimal solution based on three key dimensions: workpiece size, coating process, and capacity requirements.

1. Workpiece Size and Station Selection

TD Robotics offers S/M/L series workstations corresponding to small parts (≤800mm), medium parts (800-2000mm), and large parts (>2000mm). Key considerations include maximum envelope dimensions and weight capacity.

[TO BE FILLED: Typical workpiece size range]

2. Coating Process Matching

Different coating systems have varying requirements for spray parameters. Water-based paint systems demand higher atomization pressure and flow control precision, while powder coating requires coordination with electrostatic high-voltage generators. All TD workstations support rapid color change, completing the full process switch within [TO BE FILLED: Color change time].

3. Capacity and Cycle Time Planning

The core metric for industrial coating lines is single-piece cycle time. The TD M-series workstation achieves [TO BE FILLED: Typical cycle time] per piece under standard conditions, with annual capacity reaching [TO BE FILLED: Annual capacity data].

4. ROI Reference

Based on delivered German customer cases, automated paint cells reduce paint consumption by approximately 40% compared to manual spraying, with labor costs reduced by over 60%. Typical payback period is 18-24 months.`,
    generationTrace: [
      { paragraph: 'Workpiece Size and Station Selection', refs: [{ fieldLabel: 'Product Series', fieldKey: 'product_series', cardTitle: 'TD Paint Station OfferingCard' }] },
      { paragraph: 'ROI Reference', refs: [{ fieldLabel: 'German Customer Case', fieldKey: 'de_case', cardTitle: 'German Autohaus Case ProofCard', sourceName: 'Delivery Report' }] }
    ],
    missingInfoNeeded: [
      { fieldKey: 'cycle_time', label: 'Typical Cycle Time', cardId: 'k-td-1' },
      { fieldKey: 'color_change_time', label: 'Color Change Time', cardId: 'k-td-1' },
      { fieldKey: 'workpiece_size', label: 'Typical Workpiece Size Range', cardId: 'k-td-1' },
      { fieldKey: 'annual_capacity', label: 'Annual Capacity Data', cardId: 'k-td-2' }
    ]
  },
  {
    id: 'ca-td-2',
    title: 'Why Automated Paint Cells Are Replacing Manual Spray Booths in Europe',
    category: 'SEO Blog',
    status: '待确认',
    knowledgeRefs: ['k-td-1'],
    keywords: ['automated painting', 'spray booth replacement', 'European manufacturing', 'Industry 4.0'],
    lastModified: '2024-03-25',
    draftBody: `European manufacturers are increasingly moving away from traditional manual spray booths toward fully automated robotic paint cells. This shift is driven by three converging forces: stricter VOC emission regulations, rising labor costs, and the demand for consistent coating quality.

The EU Industrial Emissions Directive (IED) has tightened VOC limits for surface coating operations, making many legacy spray booths non-compliant. Automated paint cells, with their enclosed design and precise overspray control, reduce VOC emissions by up to 35% compared to open manual booths.

Labor economics further accelerate adoption. In Germany alone, skilled spray painters command wages of [TO BE FILLED: German spray painter hourly wage] per hour, and the profession faces a chronic shortage of qualified workers. Robotic paint cells operate 24/7 with minimal supervision.

TD Robotics offers a modular paint cell solution specifically designed for European compliance standards, supporting both waterborne and powder coating processes with [TO BE FILLED: Color change time] color-change capability.`,
    generationTrace: [
      { paragraph: 'VOC emission regulations', refs: [{ fieldLabel: 'VOC Compliance Standard', fieldKey: 'voc_standard', cardTitle: 'TD Paint Station OfferingCard' }] }
    ],
    missingInfoNeeded: [
      { fieldKey: 'de_painter_wage', label: 'German Spray Painter Hourly Wage', cardId: 'k-td-1' },
      { fieldKey: 'color_change_time', label: 'Color Change Time', cardId: 'k-td-1' }
    ]
  },
  {
    id: 'ca-td-3',
    title: 'TD Robotics Company Profile - Global Coating Automation Solutions',
    category: 'Company Profile',
    status: '草稿',
    knowledgeRefs: ['k-td-1', 'k-td-2'],
    keywords: ['TD Robotics', 'company introduction', 'coating automation', 'company profile'],
    lastModified: '2024-03-23',
    draftBody: `TD Robotics, founded in 2018, specializes in the R&D and manufacturing of industrial coating automation solutions. Headquartered in China, the company serves markets across Europe, Southeast Asia, and Latin America.

Core Product Lines:
- S Series Compact Paint Workstation (for small parts)
- M Series Standard Paint Workstation (general purpose)
- L Series Large-scale Paint Production Line (for heavy parts / complete vehicles)

Technical Advantages:
1. Self-developed 6-axis paint robot with repeatability of ±0.05mm
2. Intelligent trajectory planning system, automatically adapting to different workpiece geometries
3. Rapid color change system supporting waterborne / solvent-based / powder coatings

Having served [TO BE FILLED: Total customer count] enterprise customers globally, with a cumulative delivery of [TO BE FILLED: Total equipment delivered] automated coating systems.`,
    generationTrace: [],
    missingInfoNeeded: [
      { fieldKey: 'total_customers', label: 'Total Customer Count', cardId: 'k-td-2' },
      { fieldKey: 'total_deliveries', label: 'Total Equipment Delivered', cardId: 'k-td-2' }
    ]
  }
];

export const mockReportData: ReportData = {
  siteMetrics: {
    visits: { source: 'none', status: 'pending' },
    leads: { source: 'none', status: 'pending' },
    conversionRate: { source: 'none', status: 'pending' },
  },
  contentMetrics: {
    publishedCount: { value: 0, source: 'cms', status: 'active' },
    draftCount: { value: 1, source: 'cms', status: 'active' },
    approvalPendingCount: { value: 1, source: 'cms', status: 'active' },
  },
  socialMetrics: {
    posts: { source: 'none', status: 'unauthorized' },
    engagement: { source: 'none', status: 'unauthorized' },
  },
  leadRadar: {
    targetsCount: { source: 'none', status: 'pending' },
    verifiedCount: { source: 'none', status: 'pending' },
  },
  updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isDemo: true,
};

export const getWeeklyReport = (data: ReportData) => {
  return {
    conclusion: "【出海获客智能体】当前系统正聚焦于 涂豆科技 (tdpaintcell) 的全球增长任务。我已完成初步的产品建模与 ICP 推演，正在为您构建闭环增长引擎。",
    results: [
      `已生成内容草稿 1 篇（待你确认 1 篇）`,
      `已完成知识结构化：OfferingCard 1 项、ProofCard 0 项`,
      `已识别 P0 资料缺口 2 项（如：典型节拍、工件尺寸等）`
    ],
    blockers: [
      { title: "渠道授权未完成", impact: "LinkedIn 自动发布排程已挂起（待接入）" },
      { title: "关键参数缺失", impact: `影响选型指南生成的专业对比维度` }
    ],
    action: "立即补齐：典型节拍/换色时间（P0级）"
  };
};

export const stats = [
  { label: '知识卡完整度', value: '78%', sub: '本周新增 +8%', status: '稳步推进' },
  { label: '内容库容量', value: '1.2GB', sub: '本地存储', status: '稳步推进' },
  { label: '资产待确认', value: '4', sub: '待审批项', status: '需关注' },
  { label: 'VOC 合规权重', value: 'A+', sub: '行业领先', status: '稳步推进' },
];
