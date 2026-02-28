import mongoose, { Schema, Document, Types } from 'mongoose';

export type PRCategory = 'news-release' | 'industry-article' | 'case-study';
export type PRStatus = 'draft' | 'review' | 'approved' | 'distributed';
export type DistributionStatus = 'pending' | 'sent' | 'published' | 'failed';

export interface IPRArticle extends Document {
  title: string;
  subtitle?: string;
  body: string;
  category: PRCategory;
  status: PRStatus;
  sourceContentAssetId?: Types.ObjectId;
  distributions: Array<{
    platform: string;
    distributedAt: Date;
    distributionUrl?: string;
    status: DistributionStatus;
  }>;
  keywords: string[];
  aboutCompany?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DistributionSchema = new Schema({
  platform: { type: String, required: true },
  distributedAt: { type: Date, default: Date.now },
  distributionUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'sent', 'published', 'failed'],
    default: 'pending'
  }
}, { _id: false });

const PRArticleSchema = new Schema<IPRArticle>({
  title: { type: String, required: true },
  subtitle: { type: String },
  body: { type: String, required: true },
  category: {
    type: String,
    enum: ['news-release', 'industry-article', 'case-study'],
    default: 'news-release'
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'distributed'],
    default: 'draft'
  },
  sourceContentAssetId: { type: Schema.Types.ObjectId },
  distributions: [DistributionSchema],
  keywords: [{ type: String }],
  aboutCompany: { type: String }
}, {
  timestamps: true
});

PRArticleSchema.index({ status: 1 });
PRArticleSchema.index({ createdAt: -1 });

export const PRArticle = mongoose.model<IPRArticle>('PRArticle', PRArticleSchema);
