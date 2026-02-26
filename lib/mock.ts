
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
    title: '2024年喷涂机器人工作站选型手册',
    category: '选型手册',
    status: '待确认',
    knowledgeRefs: ['k-td-1', 'k-td-2'],
    keywords: ['喷涂机器人', '选型指南', '涂豆科技'],
    lastModified: '2024-03-24',
    draftBody: "选择合适的喷涂机器人工作站是实现涂装自动化的第一步...",
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
