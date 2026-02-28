import mongoose, { Schema, Document, Types } from 'mongoose';

export type SearchVolume = 'high' | 'medium' | 'low';
export type Competition = 'high' | 'medium' | 'low';
export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type ClusterSource = 'export-strategy' | 'manual' | 'competitor-analysis';
export type ClusterStatus = 'active' | 'archived';

export interface IRelatedKeyword {
  keyword: string;
  searchVolume: SearchVolume;
  competition: Competition;
  searchIntent: SearchIntent;
  priority: number; // 0-100
}

export interface IKeywordCluster extends Document {
  name: string;
  primaryKeyword: string;
  relatedKeywords: IRelatedKeyword[];
  source: ClusterSource;
  sourceId?: Types.ObjectId;
  status: ClusterStatus;
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

const KeywordClusterSchema = new Schema<IKeywordCluster>({
  name: { type: String, required: true },
  primaryKeyword: { type: String, required: true },
  relatedKeywords: [RelatedKeywordSchema],
  source: {
    type: String,
    enum: ['export-strategy', 'manual', 'competitor-analysis'],
    default: 'manual'
  },
  sourceId: { type: Schema.Types.ObjectId },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

KeywordClusterSchema.index({ status: 1 });
KeywordClusterSchema.index({ source: 1 });
KeywordClusterSchema.index({ primaryKeyword: 'text', name: 'text' });
KeywordClusterSchema.index({ createdAt: -1 });

export const KeywordCluster = mongoose.model<IKeywordCluster>('KeywordCluster', KeywordClusterSchema);
