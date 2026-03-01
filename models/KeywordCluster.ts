import mongoose, { Schema, Document, Types } from 'mongoose';

export type SearchVolume = 'high' | 'medium' | 'low';
export type Competition = 'high' | 'medium' | 'low';
export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type ClusterSource = 'export-strategy' | 'manual' | 'competitor-analysis' | 'icp-driven';
export type ClusterStatus = 'active' | 'archived';
export type JourneyStage = 'awareness' | 'consideration' | 'decision';
export type BuyerRole = 'decision_maker' | 'influencer' | 'user' | 'gatekeeper';

export interface IRelatedKeyword {
  keyword: string;
  searchVolume: SearchVolume;
  competition: Competition;
  searchIntent: SearchIntent;
  priority: number; // 0-100
}

// ICP-driven targeting for keyword clusters
export interface ITargetPersona {
  title: string;           // e.g. "采购经理", "技术总监"
  role: BuyerRole;         // decision_maker, influencer, user, gatekeeper
  concerns: string[];      // What they care about
}

export interface IKeywordCluster extends Document {
  name: string;
  primaryKeyword: string;
  relatedKeywords: IRelatedKeyword[];
  source: ClusterSource;
  sourceId?: Types.ObjectId;
  status: ClusterStatus;
  // ICP-driven fields (new)
  primarySearchIntent?: SearchIntent;       // Dominant intent for this cluster
  targetPersona?: ITargetPersona;           // Which buyer persona this cluster targets
  journeyStage?: JourneyStage;              // Awareness → Consideration → Decision
  addressPainPoints?: string[];             // Pain points this cluster addresses
  icpProfileId?: Types.ObjectId;            // Link to ICPProfile source
  // Recommended content types based on intent analysis
  recommendedContentTypes?: string[];       // ['blog-article', 'faq-page'] etc
  createdAt: Date;
  updatedAt: Date;
}

const RelatedKeywordSchema = new Schema<IRelatedKeyword>({
  keyword: { type: String, required: true },
  searchVolume: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  competition: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  searchIntent: {
    type: String,
    enum: ['informational', 'commercial', 'transactional', 'navigational'],
    default: 'informational'
  },
  priority: { type: Number, min: 0, max: 100, default: 50 }
}, { _id: false });

const TargetPersonaSchema = new Schema<ITargetPersona>({
  title: { type: String, required: true },
  role: {
    type: String,
    enum: ['decision_maker', 'influencer', 'user', 'gatekeeper'],
    default: 'influencer'
  },
  concerns: [{ type: String }]
}, { _id: false });

const KeywordClusterSchema = new Schema<IKeywordCluster>({
  name: { type: String, required: true },
  primaryKeyword: { type: String, required: true },
  relatedKeywords: [RelatedKeywordSchema],
  source: {
    type: String,
    enum: ['export-strategy', 'manual', 'competitor-analysis', 'icp-driven'],
    default: 'manual'
  },
  sourceId: { type: Schema.Types.ObjectId },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  // ICP-driven fields
  primarySearchIntent: {
    type: String,
    enum: ['informational', 'commercial', 'transactional', 'navigational']
  },
  targetPersona: TargetPersonaSchema,
  journeyStage: {
    type: String,
    enum: ['awareness', 'consideration', 'decision']
  },
  addressPainPoints: [{ type: String }],
  icpProfileId: { type: Schema.Types.ObjectId },
  recommendedContentTypes: [{ type: String }]
}, {
  timestamps: true
});

KeywordClusterSchema.index({ status: 1 });
KeywordClusterSchema.index({ source: 1 });
KeywordClusterSchema.index({ primaryKeyword: 'text', name: 'text' });
KeywordClusterSchema.index({ createdAt: -1 });

export const KeywordCluster = mongoose.model<IKeywordCluster>('KeywordCluster', KeywordClusterSchema);
