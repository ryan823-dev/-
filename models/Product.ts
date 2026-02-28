import mongoose, { Schema, Document } from 'mongoose';

// ICP Profile subdocument schema
const ICPProfileSchema = new Schema({
  industryTags: [{ type: String }],
  targetCustomerTypes: [{ type: String }],
  targetTitles: [{ type: String }],
  queryPack: {
    google: [{ type: String }],
    linkedin: [{ type: String }],
    directories: [{ type: String }],
    tender: [{ type: String }]  // 招投标查询
  },
  signalPack: {
    regulation: [{ type: String }],
    hiring: [{ type: String }],
    expansion: [{ type: String }],
    automation: [{ type: String }]
  },
  disqualifiers: [{ type: String }],
  scenarioPack: [{ type: String }],
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Product interface
export interface IProduct extends Document {
  slug: string;
  customDomain?: string;
  name: string;
  productType: string;
  coatingType: string;
  workpieceSize: string;
  automationLevel: string;
  advantages: { label: string; value: string }[];
  targetCountries: string[];
  applicationIndustries: string[];
  icpProfile?: {
    industryTags: string[];
    targetCustomerTypes: string[];
    targetTitles: string[];
    queryPack: {
      google: string[];
      linkedin: string[];
      directories: string[];
      tender: string[];  // 招投标查询
    };
    signalPack: {
      regulation: string[];
      hiring: string[];
      expansion: string[];
      automation: string[];
    };
    disqualifiers: string[];
    scenarioPack: string[];
    version: number;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  slug: { type: String, required: true, unique: true },
  customDomain: { type: String },
  name: { type: String, required: true },
  productType: { type: String, required: true },
  coatingType: { type: String },
  workpieceSize: { type: String },
  automationLevel: { type: String },
  advantages: [{
    label: { type: String },
    value: { type: String }
  }],
  targetCountries: [{ type: String }],
  applicationIndustries: [{ type: String }],
  icpProfile: ICPProfileSchema
}, {
  timestamps: true
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
