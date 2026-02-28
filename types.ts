
export enum NavItem {
  StrategicHome = 'strategic-home',
  KnowledgeEngine = 'knowledge-engine',
  MarketingDrive = 'marketing-drive',
  OutreachRadar = 'outreach-radar',
  SocialPresence = 'social-presence',
  PromotionHub = 'promotion-hub',
}

export type RoleType = 'BOSS' | 'STAFF';

export interface UserRole {
  type: RoleType;
  label: string;
  description: string;
  accessLevel: string;
  color: string;
  // 角色专属功能权限
  permissions: {
    canApprove: boolean;      // 审批内容/决策
    canUploadDocs: boolean;   // 上传资料
    canViewReports: boolean;  // 查看汇报
    canExecuteTasks: boolean; // 执行日常任务
  };
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
  slug?: string;
  body?: string;
  contentType?: string; // 'landing-page' | 'blog-article' | 'faq-page' | 'case-study' | 'technical-doc'
  language?: string;
  category: string;
  status: '草稿' | '待确认' | '已修改' | '待发布' | '已发布' | 'draft' | 'optimized' | 'published' | 'archived';
  publishUrl?: string;
  knowledgeRefs: string[];
  keywords: string[];
  lastModified: string;
  draftBody?: string;
  // SEO metadata
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  // SEO score
  seoScore?: {
    overall: number;
    breakdown: {
      keywordOptimization: number;
      readability: number;
      structure: number;
      internalLinking: number;
      metaTags: number;
    };
    suggestions: string[];
    lastCalculated?: string;
  };
  // Traceability
  generationTrace?: any[];
  missingInfoNeeded?: { fieldKey: string; label: string; cardId: string }[];
  // Structured data
  structuredData?: Array<{ type: string; schema: any }>;
  // Versioning
  version?: number;
  contentPlanId?: string;
  // Publishing
  publishedChannels?: Array<{ channel: string; url?: string; publishedAt: string }>;
  socialPosts?: Array<{ platform: string; postId: string; publishedAt: string; url?: string }>;
  prArticles?: Array<{ articleId: string; distributedAt: string; platforms: string[] }>;
  createdAt?: string;
  updatedAt?: string;
}

// SEO Content Hub types
export interface KeywordClusterFE {
  id: string;
  name: string;
  primaryKeyword: string;
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: 'high' | 'medium' | 'low';
    competition: 'high' | 'medium' | 'low';
    searchIntent: 'informational' | 'commercial' | 'transactional' | 'navigational';
    priority: number;
  }>;
  source: 'export-strategy' | 'manual' | 'competitor-analysis';
  status: 'active' | 'archived';
  createdAt?: string;
}

export type ContentPlanContentType = 'landing-page' | 'blog-article' | 'faq-page' | 'case-study' | 'technical-doc';

export interface ContentPlanFE {
  id: string;
  keywordClusterId?: string;
  contentType: ContentPlanContentType;
  targetKeywords: string[];
  title: string;
  scheduledDate?: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'planned' | 'generating' | 'draft' | 'optimizing' | 'ready' | 'published';
  assignedKnowledgeCards: string[];
  outline?: string[];
  notes?: string;
  createdAt?: string;
}

export interface DerivedContentFE {
  id: string;
  parentContentId: string;
  format: 'linkedin-post' | 'twitter-thread' | 'email-sequence' | 'ppt-outline' | 'internal-doc' | 'social-summary';
  content: string | string[];
  title?: string;
  metadata?: { characterCount?: number; wordCount?: number; tweetCount?: number; emailCount?: number };
  status: 'generated' | 'edited' | 'published';
  publishedTo?: { platform: string; url?: string; publishedAt: string };
  createdAt?: string;
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

// --- Social Presence Types ---

export type SocialPlatformType = 'linkedin' | 'x' | 'facebook';

export interface PRArticle {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  category: 'news-release' | 'industry-article' | 'case-study';
  status: 'draft' | 'review' | 'approved' | 'distributed';
  sourceContentAssetId?: string;
  distributions: Array<{
    platform: string;
    distributedAt: string;
    distributionUrl?: string;
    status: 'pending' | 'sent' | 'published' | 'failed';
  }>;
  keywords: string[];
  aboutCompany?: string;
  createdAt: string;
  updatedAt: string;
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
    tender: string[];  // 招投标查询
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
  
  // 深度画像维度（可选，由知识引擎联动生成）
  companyProfile?: {
    employeeRange: string;      // "10-50人" / "50-200人"
    revenueRange: string;       // "$1M-5M" / "$5M-20M"
    targetRegions: Array<{
      region: string;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
    }>;
  };
  buyerPersonas?: Array<{
    title: string;              // "采购经理" / "技术总监"
    role: 'decision_maker' | 'influencer' | 'user' | 'gatekeeper';
    concerns: string[];         // 他们关心什么
    reachChannels: string[];    // 怎么触达他们
  }>;
  purchasingBehavior?: {
    decisionCycle: string;      // "3-6个月"
    budgetRange: string;        // "$50K-200K/年"
    purchaseFrequency: string;  // "年度采购" / "项目制"
    keyFactors: string[];       // 采购决策的关键因素
  };
  painPoints?: string[];        // 客户痛点
  buyingTriggers?: string[];    // 购买触发条件
  sourceData?: {
    fromKnowledgeEngine: boolean;
    exportStrategyId?: string;
    generatedAt: string;
  };
}

export type RunStatus = 'queued' | 'running' | 'done' | 'failed' | 'canceled';

// 多国家配置接口
export interface CountryConfig {
  countryCode: string;        // 'DE'
  countryName: string;        // 'Germany'
  countryNameCN: string;      // '德国'
  language: string;           // 'German'
  priority: 'high' | 'medium' | 'low';
  allocatedQueries: number;   // 分配的查询次数
  status: 'pending' | 'running' | 'done' | 'skipped';
  companiesFound: number;     // 该国已发现的公司数
}

export interface LeadRun {
  id: string;
  productId: string;
  productName: string;
  // 兼容旧数据：单国家字段
  country?: string;
  language?: string;
  // 新增：多国家配置
  countries?: CountryConfig[];
  targetCompanyCount?: number;  // 目标公司数（默认30）
  strategy?: string;
  status: RunStatus;
  progress: {
    discovery: number;
    enrichment: number;
    contact: number;
    research: number;
    outreach: number;
    total: number;
    currentStage?: string;
    totalQueries?: number;
    completedQueries?: number;
    currentCountryIndex?: number;  // 当前执行的国家索引
    currentCountry?: string;       // 当前执行的国家代码
  };
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export type CompanyStatus = 'discovered' | 'researching' | 'researched' | 'scored' | 'outreached' | 'failed';

export interface TenderMetadata {
  tenderTitle: string;
  platform: string;          // "TED", "SAM.gov" 等
  deadline?: string;         // ISO 日期
  estimatedValue?: string;   // "€500K - €2M"
  requirements?: string[];   // ["ISO 9001", "EU supplier"]
  issuingAuthority: string;  // 发标机构
  tenderUrl?: string;
}

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
  tenderMetadata?: TenderMetadata;  // 招标机会元数据
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
  factType: 'paint_line' | 'expansion' | 'hiring' | 'automation' | 'contact_info' | 'tender_opportunity' | 'other';
  relevance: number;
  capturedAt: string;
}

export enum SignalType {
  REGULATION = 'regulation', // 法规/处罚
  HIRING = 'hiring',         // 招聘
  EXPANSION = 'expansion',   // 扩产/新建
  AUTOMATION = 'automation', // 自动化升级
  SUPPLY_CHAIN = 'supply_chain', // 供应链变动
  FACILITY = 'facility',     // 厂房/物理变动
  TENDER = 'tender'          // 招投标机会
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
