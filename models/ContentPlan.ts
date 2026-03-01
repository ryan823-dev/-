import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContentType = 'landing-page' | 'blog-article' | 'faq-page' | 'case-study' | 'technical-doc';
export type PlanPriority = 'P0' | 'P1' | 'P2';
export type PlanStatus = 'planned' | 'generating' | 'draft' | 'optimizing' | 'ready' | 'published';
export type JourneyStage = 'awareness' | 'consideration' | 'decision';
export type BuyerRole = 'decision_maker' | 'influencer' | 'user' | 'gatekeeper';
export type ContentTone = 'technical' | 'business' | 'educational' | 'persuasive';

// ICP-driven targeting for content plans
export interface IContentTargetPersona {
  title: string;           // e.g. "采购经理", "技术总监"
  role: BuyerRole;         // decision_maker, influencer, user, gatekeeper
  concerns: string[];      // What they care about
}

export interface IContentPlan extends Document {
  keywordClusterId?: Types.ObjectId;
  contentType: ContentType;
  targetKeywords: string[];
  title: string;
  scheduledDate?: Date;
  priority: PlanPriority;
  status: PlanStatus;
  assignedKnowledgeCards: Types.ObjectId[];
  outline?: string[];
  notes?: string;
  // ICP-driven fields (new)
  targetPersona?: IContentTargetPersona;    // Which buyer persona this content targets
  journeyStage?: JourneyStage;              // Awareness → Consideration → Decision
  addressPainPoints?: string[];             // Pain points this content addresses
  recommendedContentType?: ContentType;     // AI-recommended type based on search intent
  contentTone?: ContentTone;                // Tone adapted for target persona
  icpContext?: {                            // ICP context for generation
    industryTags?: string[];
    buyingTriggers?: string[];
    disqualifiers?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentTargetPersonaSchema = new Schema<IContentTargetPersona>({
  title: { type: String, required: true },
  role: {
    type: String,
    enum: ['decision_maker', 'influencer', 'user', 'gatekeeper'],
    default: 'influencer'
  },
  concerns: [{ type: String }]
}, { _id: false });

const ContentPlanSchema = new Schema<IContentPlan>({
  keywordClusterId: { type: Schema.Types.ObjectId, ref: 'KeywordCluster' },
  contentType: {
    type: String,
    enum: ['landing-page', 'blog-article', 'faq-page', 'case-study', 'technical-doc'],
    required: true
  },
  targetKeywords: [{ type: String }],
  title: { type: String, required: true },
  scheduledDate: { type: Date },
  priority: {
    type: String,
    enum: ['P0', 'P1', 'P2'],
    default: 'P1'
  },
  status: {
    type: String,
    enum: ['planned', 'generating', 'draft', 'optimizing', 'ready', 'published'],
    default: 'planned'
  },
  assignedKnowledgeCards: [{ type: Schema.Types.ObjectId }],
  outline: [{ type: String }],
  notes: { type: String },
  // ICP-driven fields
  targetPersona: ContentTargetPersonaSchema,
  journeyStage: {
    type: String,
    enum: ['awareness', 'consideration', 'decision']
  },
  addressPainPoints: [{ type: String }],
  recommendedContentType: {
    type: String,
    enum: ['landing-page', 'blog-article', 'faq-page', 'case-study', 'technical-doc']
  },
  contentTone: {
    type: String,
    enum: ['technical', 'business', 'educational', 'persuasive']
  },
  icpContext: {
    industryTags: [{ type: String }],
    buyingTriggers: [{ type: String }],
    disqualifiers: [{ type: String }]
  }
}, {
  timestamps: true
});

ContentPlanSchema.index({ status: 1 });
ContentPlanSchema.index({ priority: 1 });
ContentPlanSchema.index({ scheduledDate: 1 });
ContentPlanSchema.index({ keywordClusterId: 1 });
ContentPlanSchema.index({ createdAt: -1 });

export const ContentPlan = mongoose.model<IContentPlan>('ContentPlan', ContentPlanSchema);
