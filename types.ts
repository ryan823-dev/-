
export enum NavItem {
  StrategicHome = 'strategic-home',
  KnowledgeEngine = 'knowledge-engine',
  MarketingDrive = 'marketing-drive',
  OutreachRadar = 'outreach-radar',
  SocialPresence = 'social-presence',
  PromotionHub = 'promotion-hub',
}

export type RoleType = 'CEO' | 'CMO' | 'CTO' | 'SALES';

export interface UserRole {
  type: RoleType;
  label: string;
  description: string;
  accessLevel: string;
  color: string;
}

export interface MetricSource {
  value?: number | string;
  unit?: string;
  source: 'ga' | 'gsc' | 'cms' | 'linkedin' | 'x' | 'internal' | 'none';
  status: 'active' | 'pending' | 'unauthorized';
}

export interface ReportData {
  siteMetrics: {
    visits: MetricSource;
    leads: MetricSource;
    conversionRate: MetricSource;
  };
  contentMetrics: {
    publishedCount: MetricSource;
    draftCount: MetricSource;
    approvalPendingCount: MetricSource;
  };
  socialMetrics: {
    posts: MetricSource;
    engagement: MetricSource;
  };
  leadRadar: {
    targetsCount: MetricSource;
    verifiedCount: MetricSource;
  };
  updatedAt: string;
  isDemo: boolean;
}

export interface KnowledgeCard {
  id: string;
  type: 'Company' | 'Offering' | 'Proof';
  title: string;
  fields: { label: string; value: string; fieldKey: string }[];
  completion: number;
  confidence: number;
  missingFields: { fieldKey: string; label: string; reason: string; impact: string }[];
  evidence: { sourceId: string; sourceName: string }[];
}

export interface ClientAction {
  id: string;
  type: '资料补齐' | '内容共创' | '授权接入' | '方向拍板' | '回执记录';
  priority: 'P0' | 'P1' | 'P2';
  status: '待处理' | '处理中' | '已完成';
  sourceModule: '专业知识引擎' | '营销驱动系统' | '海外声量中台' | '出海获客雷达';
  title: string;
  reason: string;
  impact: string;
  required?: string[];
  suggested?: string;
  evidence?: string;
  ctaLabel: string;
  ctaRoute: string; // Deep link string
  completedAt?: string;
  resultSummary?: string;
}

export interface ContentAsset {
  id: string;
  title: string;
  category: string;
  status: '草稿' | '待确认' | '已修改' | '待发布' | '已发布';
  publishUrl?: string;
  knowledgeRefs: string[];
  keywords: string[];
  lastModified: string;
  draftBody?: string;
  generationTrace?: any[];
  missingInfoNeeded?: { fieldKey: string; label: string; cardId: string }[];
}

// Fix: Add missing SEOTask interface to resolve import error in SEOStudio.tsx
export interface SEOTask {
  id: string;
  title: string;
  category: string;
  status: string;
  healthScore: number;
}

// Fix: Update Lead interface to include fields used in AIProspecting component and make optional fields flexible
export interface Lead {
  id: string;
  company: string;
  industry: string;
  intent?: 'high' | 'medium' | 'low';
  contactMasked?: string; 
  contact?: string;
  status?: string;
}

export interface PublisherResult {
  status: 'success' | 'error';
  url?: string;
  message?: string;
}

// --- AI SDR System Types ---

export interface Product {
  id: string;
  slug: string; // e.g. 'tdpaintcell'
  customDomain?: string; // e.g. 'tdpaintcell.vertax.top'
  name: string;
  productType: string;
  coatingType: string;
  workpieceSize: string;
  automationLevel: string;
  advantages: { label: string; value: string }[];
  targetCountries: string[];
  applicationIndustries: string[];
  createdAt: string;
  icpProfile?: ICPProfile;
}

export interface ICPProfile {
  industryTags: string[];
  targetCustomerTypes: string[];
  targetTitles: string[];
  queryPack: {
    google: string[];
    linkedin: string[];
    directories: string[];
  };
  signalPack: {
    regulation: string[];
    hiring: string[];
    expansion: string[];
    automation: string[];
  };
  disqualifiers: string[];
  scenarioPack: string[];
  version: number;
  updatedAt: string;
}

export type RunStatus = 'queued' | 'running' | 'done' | 'failed' | 'canceled';

export interface LeadRun {
  id: string;
  productId: string;
  productName: string;
  country: string;
  language: string;
  status: RunStatus;
  progress: {
    discovery: number;
    contact: number;
    research: number;
    outreach: number;
    total: number;
  };
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export type CompanyStatus = 'discovered' | 'researching' | 'researched' | 'scored' | 'outreached' | 'failed';

export interface Company {
  id: string;
  leadRunId?: string;
  name: string;
  website?: string;
  domain?: string;
  country: string;
  industry: string;
  source: string;
  status: CompanyStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  score?: Scoring;
  research?: Research;
  outreach?: Outreach;
}

export interface Contact {
  id: string;
  companyId: string;
  name?: string;
  title: string;
  linkedinUrl?: string;
  emailBest?: string;
  emailCandidates: string[];
  emailStatus: 'unverified' | 'likely' | 'verified' | 'invalid';
  phoneRaw?: string;
  phoneNormalized?: string;
  whatsapp?: string;
  whatsappPossible: boolean;
  source: string;
  sourceUrl?: string;
  confidence: number;
  createdAt: string;
}

export interface Evidence {
  id: string;
  companyId: string;
  contactId?: string;
  url: string;
  pageType: 'home' | 'about' | 'contact' | 'careers' | 'news' | 'linkedin' | 'dir' | 'pdf' | 'other';
  snippet: string;
  extractedFact: string;
  factType: 'paint_line' | 'expansion' | 'hiring' | 'automation' | 'contact_info' | 'other';
  relevance: number;
  capturedAt: string;
}

export enum SignalType {
  REGULATION = 'regulation', // 法规/处罚
  HIRING = 'hiring',         // 招聘
  EXPANSION = 'expansion',   // 扩产/新建
  AUTOMATION = 'automation', // 自动化升级
  SUPPLY_CHAIN = 'supply_chain', // 供应链变动
  FACILITY = 'facility'      // 厂房/物理变动
}

export enum SignalStrength {
  TRIGGER = 'trigger', // 生死信号 (Tier A)
  HIGH = 'high',       // 行为信号 (Tier B)
  MEDIUM = 'medium',   // 结构信号 (Tier C)
  LOW = 'low'          // 噪声/背景
}

export interface ShadowSignal {
  id: string;
  companyId: string;
  type: SignalType;
  subType: string;      // 具体项，如 "manual_painter_hiring"
  strength: SignalStrength;
  score: number;        // 基础分值
  evidence: {
    url?: string;
    snippet: string;    // 关键证据片段
    timestamp: string;
  };
  source: string;       // 来源，如 "LinkedIn", "Gov_Portal"
  confidence: number;   // AI 判定信心值 0-1
}

export enum LeadTier {
  TIER_A = 'Tier A (Critical Pain)', // 存在 Trigger 信号
  TIER_B = 'Tier B (Active Change)', // 存在 High Behavior 信号
  TIER_C = 'Tier C (High Potential)',// 结构匹配度高
  TIER_D = 'Tier D (Cold Lead)'      // 普通线索
}

export interface Research {
  id: string;
  companyId: string;
  summary: string;
  signals: ShadowSignal[];
  purchaseIntent: 'high' | 'medium' | 'low';
  keyHooks: string[];
  updatedAt: string;
}

export interface Scoring {
  id: string;
  companyId: string;
  total: number;
  tier: LeadTier;
  breakdown: {
    triggerScore: number;
    behaviorScore: number;
    structuralScore: number;
  };
  reasons: string[];
  updatedAt: string;
}

export interface Outreach {
  id: string;
  companyId: string;
  contactId?: string;
  emailA: { subject: string; body: string; citedEvidenceIds: string[] };
  emailB: { subject: string; body: string; citedEvidenceIds: string[] };
  whatsapp: { message: string; citedEvidenceIds: string[] };
  updatedAt: string;
}
