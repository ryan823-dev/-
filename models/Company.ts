import mongoose, { Schema, Document, Types } from 'mongoose';

export type CompanyStatus = 'discovered' | 'researching' | 'researched' | 'scored' | 'contacted' | 'replied' | 'won' | 'lost' | 'outreached' | 'failed';
export type SignalType = 'regulation' | 'hiring' | 'expansion' | 'automation' | 'supply_chain' | 'facility' | 'tender';
export type SignalStrength = 'trigger' | 'high' | 'medium' | 'low';
export type LeadTier = 'Tier A (Critical Pain)' | 'Tier B (Active Change)' | 'Tier C (High Potential)' | 'Tier D (Cold Lead)';

// Tender Metadata subdocument (招标机会元数据)
const TenderMetadataSchema = new Schema({
  tenderTitle: { type: String, required: true },
  platform: { type: String, required: true },  // "TED", "SAM.gov" 等
  deadline: { type: String },                  // ISO 日期
  estimatedValue: { type: String },            // "€500K - €2M"
  requirements: [{ type: String }],            // ["ISO 9001", "EU supplier"]
  issuingAuthority: { type: String, required: true },  // 发标机构
  tenderUrl: { type: String }
}, { _id: false });

// Contact subdocument
const ContactSchema = new Schema({
  name: { type: String },
  title: { type: String, required: true },
  linkedinUrl: { type: String },
  emailBest: { type: String },
  emailCandidates: [{ type: String }],
  emailStatus: { 
    type: String, 
    enum: ['unverified', 'likely', 'verified', 'invalid'],
    default: 'unverified'
  },
  phoneRaw: { type: String },
  phoneNormalized: { type: String },
  whatsapp: { type: String },
  whatsappPossible: { type: Boolean, default: false },
  source: { type: String },
  sourceUrl: { type: String },
  confidence: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Shadow Signal subdocument
const ShadowSignalSchema = new Schema({
  type: { 
    type: String, 
    enum: ['regulation', 'hiring', 'expansion', 'automation', 'supply_chain', 'facility', 'tender']
  },
  subType: { type: String },
  strength: { 
    type: String, 
    enum: ['trigger', 'high', 'medium', 'low']
  },
  score: { type: Number, default: 0 },
  evidence: {
    url: { type: String },
    snippet: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  source: { type: String },
  confidence: { type: Number, default: 0 }
});

// Research subdocument
const ResearchSchema = new Schema({
  summary: { type: String },
  signals: [ShadowSignalSchema],
  purchaseIntent: { 
    type: String, 
    enum: ['high', 'medium', 'low']
  },
  keyHooks: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

// Scoring subdocument
const ScoringSchema = new Schema({
  total: { type: Number, default: 0 },
  tier: { 
    type: String, 
    enum: ['Tier A (Critical Pain)', 'Tier B (Active Change)', 'Tier C (High Potential)', 'Tier D (Cold Lead)']
  },
  breakdown: {
    relevanceScore: { type: Number, default: 0 },
    triggerScore: { type: Number, default: 0 },
    behaviorScore: { type: Number, default: 0 },
    structuralScore: { type: Number, default: 0 }
  },
  reasons: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

// Outreach subdocument
const OutreachSchema = new Schema({
  contactId: { type: Schema.Types.ObjectId },
  emailA: {
    subject: { type: String },
    body: { type: String },
    citedEvidenceIds: [{ type: String }]
  },
  emailB: {
    subject: { type: String },
    body: { type: String },
    citedEvidenceIds: [{ type: String }]
  },
  whatsapp: {
    message: { type: String },
    citedEvidenceIds: [{ type: String }]
  },
  updatedAt: { type: Date, default: Date.now }
});

// Website Analysis subdocument (官网深度分析)
const WebsiteAnalysisSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'qualified', 'maybe', 'disqualified', 'failed'],
    default: 'pending'
  },
  qualificationReason: { type: String },
  relevanceScore: { type: Number, default: 0 },

  // 业务特征提取
  products: [{
    name: { type: String },
    description: { type: String }
  }],
  equipment: [{
    type: { type: String },
    brand: { type: String },
    context: { type: String }
  }],
  technologies: [{ type: String }],
  companySize: {
    employees: { type: String },
    facilities: { type: String },
    indicators: [{ type: String }]
  },

  // 四维相关性评分
  breakdown: {
    industryMatch: { score: { type: Number }, reasoning: { type: String } },
    businessRelevance: { score: { type: Number }, reasoning: { type: String } },
    sizeMatch: { score: { type: Number }, reasoning: { type: String } },
    technologyGap: { score: { type: Number }, reasoning: { type: String } }
  },

  // 爬取元数据
  pagesCrawled: [{
    url: { type: String },
    pageType: { type: String },
    success: { type: Boolean }
  }],
  language: { type: String },
  analyzedAt: { type: Date },
  errorMessage: { type: String }
}, { _id: false });

// Evidence subdocument
const EvidenceSchema = new Schema({
  contactId: { type: Schema.Types.ObjectId },
  url: { type: String },
  pageType: { 
    type: String, 
    enum: ['home', 'about', 'contact', 'careers', 'news', 'linkedin', 'dir', 'pdf', 'other']
  },
  snippet: { type: String },
  extractedFact: { type: String },
  factType: { 
    type: String, 
    enum: ['paint_line', 'expansion', 'hiring', 'automation', 'contact_info', 'tender_opportunity', 'other']
  },
  relevance: { type: Number, default: 0 },
  capturedAt: { type: Date, default: Date.now }
});

// Main Company interface
export interface ICompany extends Document {
  leadRunId?: Types.ObjectId;
  name: string;
  website?: string;
  domain?: string;
  country: string;
  industry: string;
  source: string;
  status: CompanyStatus;
  notes?: string;
  tenderMetadata?: {
    tenderTitle: string;
    platform: string;
    deadline?: string;
    estimatedValue?: string;
    requirements?: string[];
    issuingAuthority: string;
    tenderUrl?: string;
  };
  websiteAnalysis?: {
    status: 'pending' | 'analyzing' | 'qualified' | 'maybe' | 'disqualified' | 'failed';
    qualificationReason?: string;
    relevanceScore: number;
    products: Array<{ name: string; description?: string }>;
    equipment: Array<{ type: string; brand?: string; context?: string }>;
    technologies: string[];
    companySize?: {
      employees?: string;
      facilities?: string;
      indicators?: string[];
    };
    breakdown: {
      industryMatch: { score: number; reasoning: string };
      businessRelevance: { score: number; reasoning: string };
      sizeMatch: { score: number; reasoning: string };
      technologyGap: { score: number; reasoning: string };
    };
    pagesCrawled: Array<{ url: string; pageType: string; success: boolean }>;
    language?: string;
    analyzedAt?: Date;
    errorMessage?: string;
  };
  contacts: typeof ContactSchema[];
  evidence: typeof EvidenceSchema[];
  research?: typeof ResearchSchema;
  score?: typeof ScoringSchema;
  outreach?: typeof OutreachSchema;
  outreachHistory?: Array<{
    type: string;
    channel: string;
    emailType?: string;
    toEmail?: string;
    subject?: string;
    sentAt: Date;
    messageId?: string;
    status: string;
  }>;
  followUpNotes?: Array<{
    type: string;
    note: string;
    createdAt: Date;
  }>;
  lastOutreachAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  leadRunId: { type: Schema.Types.ObjectId, ref: 'LeadRun' },
  name: { type: String, required: true },
  website: { type: String },
  domain: { type: String },
  country: { type: String, required: true },
  industry: { type: String },
  source: { type: String },
  status: { 
    type: String, 
    enum: ['discovered', 'researching', 'researched', 'scored', 'contacted', 'replied', 'won', 'lost', 'outreached', 'failed'],
    default: 'discovered'
  },
  notes: { type: String },
  tenderMetadata: TenderMetadataSchema,
  websiteAnalysis: WebsiteAnalysisSchema,
  contacts: [ContactSchema],
  evidence: [EvidenceSchema],
  research: ResearchSchema,
  score: ScoringSchema,
  outreach: OutreachSchema,
  outreachHistory: [{
    type: { type: String },
    channel: { type: String },
    emailType: { type: String },
    toEmail: { type: String },
    subject: { type: String },
    sentAt: { type: Date },
    messageId: { type: String },
    status: { type: String }
  }],
  followUpNotes: [{
    type: { type: String },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  lastOutreachAt: { type: Date }
}, {
  timestamps: true
});

// Indexes
CompanySchema.index({ leadRunId: 1 });
CompanySchema.index({ status: 1 });
CompanySchema.index({ 'score.total': -1 });
CompanySchema.index({ name: 'text', industry: 'text' });
CompanySchema.index({ 'websiteAnalysis.status': 1 });
CompanySchema.index({ domain: 1 });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
