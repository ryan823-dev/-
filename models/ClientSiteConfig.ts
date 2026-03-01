import mongoose, { Schema, Document } from 'mongoose';

export interface IClientSiteConfig extends Document {
  productSlug: string;
  clientName: string;
  siteType: 'supabase' | 'wordpress' | 'custom';

  supabaseConfig?: {
    projectUrl: string;
    functionName: string;
    pushSecret: string;
  };

  fieldMapping: {
    titleField: string;
    titleZhField: string;
    bodyField: string;
    bodyZhField: string;
    slugField: string;
    statusField: string;
    pushStatus: string;
    sourceIdField: string;
  };

  approvalTimeoutHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSiteConfigSchema = new Schema<IClientSiteConfig>({
  productSlug: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  siteType: {
    type: String,
    enum: ['supabase', 'wordpress', 'custom'],
    default: 'supabase'
  },

  supabaseConfig: {
    projectUrl: { type: String },
    functionName: { type: String },
    pushSecret: { type: String },
  },

  fieldMapping: {
    titleField: { type: String, default: 'title' },
    titleZhField: { type: String, default: 'title_zh' },
    bodyField: { type: String, default: 'body' },
    bodyZhField: { type: String, default: 'body_zh' },
    slugField: { type: String, default: 'slug' },
    statusField: { type: String, default: 'status' },
    pushStatus: { type: String, default: 'published' },
    sourceIdField: { type: String, default: 'vertax_asset_id' },
  },

  approvalTimeoutHours: { type: Number, default: 24 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const ClientSiteConfig = mongoose.model<IClientSiteConfig>('ClientSiteConfig', ClientSiteConfigSchema);
