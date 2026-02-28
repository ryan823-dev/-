import mongoose, { Schema, Document } from 'mongoose';

export type IntegrationProvider = 'google_analytics' | 'search_console';
export type IntegrationStatus = 'active' | 'expired' | 'error' | 'pending';

export interface IApiIntegration extends Document {
  provider: IntegrationProvider;
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
  };
  config: {
    propertyId?: string;
    siteUrl?: string;
    [key: string]: unknown;
  };
  status: IntegrationStatus;
  lastSyncAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApiIntegrationSchema = new Schema<IApiIntegration>({
  provider: {
    type: String,
    enum: ['google_analytics', 'search_console'],
    required: true,
    unique: true
  },
  credentials: {
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date }
  },
  config: { type: Schema.Types.Mixed, default: {} },
  status: {
    type: String,
    enum: ['active', 'expired', 'error', 'pending'],
    default: 'pending'
  },
  lastSyncAt: { type: Date },
  errorMessage: { type: String }
}, {
  timestamps: true
});

export const ApiIntegration = mongoose.model<IApiIntegration>('ApiIntegration', ApiIntegrationSchema);
