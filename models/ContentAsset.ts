import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContentAssetStatus = 'draft' | 'optimized' | 'published' | 'archived';
export type ContentLanguage = 'en' | 'zh' | 'de' | 'fr' | 'ja';
export type StructuredDataType = 'FAQPage' | 'HowTo' | 'Article' | 'Product' | 'BreadcrumbList';

export interface ISEOScoreBreakdown {
  keywordOptimization: number;
  readability: number;
  structure: number;
  internalLinking: number;
  metaTags: number;
}

export interface ISEOScore {
  overall: number;
  breakdown: ISEOScoreBreakdown;
  suggestions: string[];
  lastCalculated: Date;
}

export interface IGenerationTrace {
  knowledgeCardId: Types.ObjectId;
  cardTitle?: string;
  usedFields: string[];
  confidence: number;
}

export interface IStructuredData {
  type: StructuredDataType;
  schema: Record<string, any>;
}

export interface IPublishedChannel {
  channel: string;
  url?: string;
  publishedAt: Date;
}

export interface IContentAsset extends Document {
  contentPlanId?: Types.ObjectId;
  
  // Basic content
  title: string;
  slug: string;
  body: string;
  contentType: string;
  language: ContentLanguage;
  
  // SEO metadata
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  secondaryKeywords: string[];
  
  // SEO score
  seoScore?: ISEOScore;
  
  // Traceability
  generationTrace: IGenerationTrace[];
  missingInfoNeeded?: string[];
  
  // Structured data
  structuredData?: IStructuredData[];
  
  // Versioning
  version: number;
  previousVersionId?: Types.ObjectId;
  
  // Status & Publishing
  status: ContentAssetStatus;
  publishedAt?: Date;
  publishedChannels?: IPublishedChannel[];
  
  // Legacy compatibility
  category?: string;
  knowledgeRefs?: string[];
  keywords?: string[];
  lastModified?: string;
  draftBody?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const SEOScoreBreakdownSchema = new Schema<ISEOScoreBreakdown>({
  keywordOptimization: { type: Number, min: 0, max: 100, default: 0 },
  readability: { type: Number, min: 0, max: 100, default: 0 },
  structure: { type: Number, min: 0, max: 100, default: 0 },
  internalLinking: { type: Number, min: 0, max: 100, default: 0 },
  metaTags: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

const SEOScoreSchema = new Schema<ISEOScore>({
  overall: { type: Number, min: 0, max: 100, default: 0 },
  breakdown: { type: SEOScoreBreakdownSchema, default: () => ({}) },
  suggestions: [{ type: String }],
  lastCalculated: { type: Date, default: Date.now }
}, { _id: false });

const GenerationTraceSchema = new Schema<IGenerationTrace>({
  knowledgeCardId: { type: Schema.Types.ObjectId, required: true },
  cardTitle: { type: String },
  usedFields: [{ type: String }],
  confidence: { type: Number, min: 0, max: 100, default: 80 }
}, { _id: false });

const StructuredDataSchema = new Schema<IStructuredData>({
  type: {
    type: String,
    enum: ['FAQPage', 'HowTo', 'Article', 'Product', 'BreadcrumbList'],
    required: true
  },
  schema: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const PublishedChannelSchema = new Schema<IPublishedChannel>({
  channel: { type: String, required: true },
  url: { type: String },
  publishedAt: { type: Date, default: Date.now }
}, { _id: false });

const ContentAssetSchema = new Schema<IContentAsset>({
  contentPlanId: { type: Schema.Types.ObjectId, ref: 'ContentPlan' },
  
  // Basic content
  title: { type: String, required: true },
  slug: { type: String, required: true },
  body: { type: String, default: '' },
  contentType: { type: String, default: 'blog-article' },
  language: {
    type: String,
    enum: ['en', 'zh', 'de', 'fr', 'ja'],
    default: 'en'
  },
  
  // SEO metadata
  metaTitle: { type: String },
  metaDescription: { type: String },
  canonicalUrl: { type: String },
  focusKeyword: { type: String },
  secondaryKeywords: [{ type: String }],
  
  // SEO score
  seoScore: { type: SEOScoreSchema },
  
  // Traceability
  generationTrace: [GenerationTraceSchema],
  missingInfoNeeded: [{ type: String }],
  
  // Structured data
  structuredData: [StructuredDataSchema],
  
  // Versioning
  version: { type: Number, default: 1 },
  previousVersionId: { type: Schema.Types.ObjectId, ref: 'ContentAsset' },
  
  // Status & Publishing
  status: {
    type: String,
    enum: ['draft', 'optimized', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: { type: Date },
  publishedChannels: [PublishedChannelSchema],
  
  // Legacy compatibility with existing frontend
  category: { type: String },
  knowledgeRefs: [{ type: String }],
  keywords: [{ type: String }],
  lastModified: { type: String },
  draftBody: { type: String }
}, {
  timestamps: true
});

// Pre-save hook to generate slug from title
ContentAssetSchema.pre('save', function(this: IContentAsset) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }
  // Sync draftBody with body for legacy compatibility
  if (this.isModified('body') && this.body) {
    this.draftBody = this.body;
  }
  // Sync keywords with secondaryKeywords
  if (this.isModified('secondaryKeywords') && this.secondaryKeywords?.length) {
    this.keywords = [this.focusKeyword, ...this.secondaryKeywords].filter(Boolean);
  }
});

ContentAssetSchema.index({ status: 1 });
ContentAssetSchema.index({ contentPlanId: 1 });
ContentAssetSchema.index({ slug: 1 });
ContentAssetSchema.index({ 'seoScore.overall': -1 });
ContentAssetSchema.index({ createdAt: -1 });
ContentAssetSchema.index({ title: 'text', body: 'text' });

export const ContentAsset = mongoose.model<IContentAsset>('ContentAsset', ContentAssetSchema);
