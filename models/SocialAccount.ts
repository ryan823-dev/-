import mongoose, { Schema, Document } from 'mongoose';

export type PlatformType = 'linkedin' | 'x' | 'facebook';
export type AccountStatus = 'active' | 'expired' | 'error' | 'pending';

export interface ISocialAccount extends Document {
  platform: PlatformType;
  accountHandle: string;
  accountName: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  profileImageUrl?: string;
  followersCount?: number;
  connectedAt: Date;
  lastSyncAt?: Date;
  status: AccountStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialAccountSchema = new Schema<ISocialAccount>({
  platform: { 
    type: String, 
    enum: ['linkedin', 'x', 'facebook'],
    required: true 
  },
  accountHandle: { type: String, required: true },
  accountName: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  profileImageUrl: { type: String },
  followersCount: { type: Number, default: 0 },
  connectedAt: { type: Date, default: Date.now },
  lastSyncAt: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'error', 'pending'],
    default: 'pending'
  },
  errorMessage: { type: String }
}, {
  timestamps: true
});

SocialAccountSchema.index({ platform: 1, accountHandle: 1 }, { unique: true });

export const SocialAccount = mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema);
