import mongoose, { Schema, Document, Types } from 'mongoose';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface ISocialPost extends Document {
  accountIds: Types.ObjectId[];
  platforms: string[];
  content: string;
  mediaUrls: string[];
  status: PostStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  platformPostIds?: { platform: string; postId: string }[];
  targetAudience?: string;
  tags: string[];
  errorMessage?: string;
  // 联动字段
  sourceContentAssetId?: Types.ObjectId;
  rewriteType?: 'manual' | 'ai-from-asset';
  linkedinFormat?: 'article' | 'post';
  metrics?: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    engagementRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema = new Schema<ISocialPost>({
  accountIds: [{ type: Schema.Types.ObjectId, ref: 'SocialAccount' }],
  platforms: [{ type: String, enum: ['linkedin', 'x', 'facebook'] }],
  content: { type: String, required: true },
  mediaUrls: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  scheduledFor: { type: Date },
  publishedAt: { type: Date },
  platformPostIds: [{
    platform: { type: String },
    postId: { type: String }
  }],
  targetAudience: { type: String },
  tags: [{ type: String }],
  errorMessage: { type: String },
  sourceContentAssetId: { type: Schema.Types.ObjectId },
  rewriteType: { type: String, enum: ['manual', 'ai-from-asset'] },
  linkedinFormat: { type: String, enum: ['article', 'post'] },
  metrics: {
    impressions: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

SocialPostSchema.index({ status: 1, scheduledFor: 1 });
SocialPostSchema.index({ platforms: 1 });
SocialPostSchema.index({ createdAt: -1 });

export const SocialPost = mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);
