import mongoose, { Schema, Document, Types } from 'mongoose';

export type RunStatus = 'queued' | 'running' | 'done' | 'failed' | 'canceled';

// 国家配置接口
export interface ICountryConfig {
  countryCode: string;
  countryName: string;
  countryNameCN: string;
  language: string;
  priority: 'high' | 'medium' | 'low';
  allocatedQueries: number;
  status: 'pending' | 'running' | 'done' | 'skipped';
  companiesFound: number;
}

export interface ILeadRun extends Document {
  productId: Types.ObjectId;
  productName: string;
  // 兼容旧数据
  country?: string;
  language?: string;
  // 多国家配置
  countries?: ICountryConfig[];
  targetCompanyCount?: number;
  strategy: string;
  status: RunStatus;
  progress: {
    discovery: number;
    enrichment: number;
    contact: number;
    research: number;
    outreach: number;
    total: number;
    currentStage: string;
    totalQueries: number;
    completedQueries: number;
    currentCountryIndex: number;
    currentCountry: string;
  };
  errorMessage?: string;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 国家配置子 Schema
const CountryConfigSchema = new Schema({
  countryCode: { type: String, required: true },
  countryName: { type: String, required: true },
  countryNameCN: { type: String, required: true },
  language: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  allocatedQueries: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'running', 'done', 'skipped'], default: 'pending' },
  companiesFound: { type: Number, default: 0 }
}, { _id: false });

const LeadRunSchema = new Schema<ILeadRun>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  // 兼容旧数据：单国家字段
  country: { type: String },
  language: { type: String, default: 'en' },
  // 多国家配置
  countries: [CountryConfigSchema],
  targetCompanyCount: { type: Number, default: 30 },
  strategy: { type: String, default: 'comprehensive' },
  status: { 
    type: String, 
    enum: ['queued', 'running', 'done', 'failed', 'canceled'],
    default: 'queued'
  },
  progress: {
    discovery: { type: Number, default: 0 },
    enrichment: { type: Number, default: 0 },
    contact: { type: Number, default: 0 },
    research: { type: Number, default: 0 },
    outreach: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currentStage: { type: String, default: 'idle' },
    totalQueries: { type: Number, default: 0 },
    completedQueries: { type: Number, default: 0 },
    currentCountryIndex: { type: Number, default: 0 },
    currentCountry: { type: String }
  },
  errorMessage: { type: String },
  startedAt: { type: Date },
  finishedAt: { type: Date }
}, {
  timestamps: true
});

// Index for querying by product and status
LeadRunSchema.index({ productId: 1, status: 1 });
LeadRunSchema.index({ createdAt: -1 });

export const LeadRun = mongoose.model<ILeadRun>('LeadRun', LeadRunSchema);
