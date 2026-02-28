import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContentType = 'landing-page' | 'blog-article' | 'faq-page' | 'case-study' | 'technical-doc';
export type PlanPriority = 'P0' | 'P1' | 'P2';
export type PlanStatus = 'planned' | 'generating' | 'draft' | 'optimizing' | 'ready' | 'published';

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
  createdAt: Date;
  updatedAt: Date;
}

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
  notes: { type: String }
}, {
  timestamps: true
});

ContentPlanSchema.index({ status: 1 });
ContentPlanSchema.index({ priority: 1 });
ContentPlanSchema.index({ scheduledDate: 1 });
ContentPlanSchema.index({ keywordClusterId: 1 });
ContentPlanSchema.index({ createdAt: -1 });

export const ContentPlan = mongoose.model<IContentPlan>('ContentPlan', ContentPlanSchema);
