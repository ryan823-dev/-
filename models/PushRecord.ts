import mongoose, { Schema, Document, Types } from 'mongoose';

export type PushStatus = 'pending' | 'confirmed' | 'timeout' | 'failed' | 'escalated';

export interface IPushRecord extends Document {
  assetId: Types.ObjectId;
  productSlug: string;
  status: PushStatus;
  targetUrl?: string;
  remoteId?: string;
  pushedAt: Date;
  timeoutAt: Date;
  confirmedAt?: Date;
  escalatedAt?: Date;
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushRecordSchema = new Schema<IPushRecord>({
  assetId: { type: Schema.Types.ObjectId, ref: 'ContentAsset', required: true },
  productSlug: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'timeout', 'failed', 'escalated'],
    default: 'pending'
  },
  targetUrl: { type: String },
  remoteId: { type: String },
  pushedAt: { type: Date, default: Date.now },
  timeoutAt: { type: Date, required: true },
  confirmedAt: { type: Date },
  escalatedAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String },
}, {
  timestamps: true
});

PushRecordSchema.index({ status: 1, timeoutAt: 1 });
PushRecordSchema.index({ assetId: 1 });
PushRecordSchema.index({ productSlug: 1 });

export const PushRecord = mongoose.model<IPushRecord>('PushRecord', PushRecordSchema);
