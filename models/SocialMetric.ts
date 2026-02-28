import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISocialMetric extends Document {
  postId: Types.ObjectId;
  accountId: Types.ObjectId;
  platform: string;
  metricDate: Date;
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  clickThroughRate: number;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocialMetricSchema = new Schema<ISocialMetric>({
  postId: { type: Schema.Types.ObjectId, ref: 'SocialPost', required: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'SocialAccount', required: true },
  platform: { type: String, enum: ['x', 'facebook'], required: true },
  metricDate: { type: Date, required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  clickThroughRate: { type: Number, default: 0 },
  syncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

SocialMetricSchema.index({ postId: 1, metricDate: 1 });
SocialMetricSchema.index({ accountId: 1, platform: 1, metricDate: -1 });

export const SocialMetric = mongoose.model<ISocialMetric>('SocialMetric', SocialMetricSchema);
