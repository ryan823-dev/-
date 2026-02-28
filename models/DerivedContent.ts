import mongoose, { Schema, Document, Types } from 'mongoose';

export type DerivedFormat = 'linkedin-post' | 'twitter-thread' | 'email-sequence' | 'ppt-outline' | 'internal-doc' | 'social-summary';
export type DerivedStatus = 'generated' | 'edited' | 'published';

export interface IDerivedMetadata {
  characterCount?: number;
  wordCount?: number;
  tweetCount?: number;
  emailCount?: number;
  readingTime?: number;
}

export interface IPublishedTo {
  platform: string;
  url?: string;
  postId?: string;
  publishedAt: Date;
}

export interface IDerivedContent extends Document {
  parentContentId: Types.ObjectId;
  format: DerivedFormat;
  content: string | string[];
  title?: string;
  metadata?: IDerivedMetadata;
  status: DerivedStatus;
  publishedTo?: IPublishedTo;
  createdAt: Date;
  updatedAt: Date;
}

const DerivedMetadataSchema = new Schema<IDerivedMetadata>({
  characterCount: { type: Number },
  wordCount: { type: Number },
  tweetCount: { type: Number },
  emailCount: { type: Number },
  readingTime: { type: Number }
}, { _id: false });

const PublishedToSchema = new Schema<IPublishedTo>({
  platform: { type: String, required: true },
  url: { type: String },
  postId: { type: String },
  publishedAt: { type: Date, default: Date.now }
}, { _id: false });

const DerivedContentSchema = new Schema<IDerivedContent>({
  parentContentId: { type: Schema.Types.ObjectId, ref: 'ContentAsset', required: true },
  format: {
    type: String,
    enum: ['linkedin-post', 'twitter-thread', 'email-sequence', 'ppt-outline', 'internal-doc', 'social-summary'],
    required: true
  },
  content: { type: Schema.Types.Mixed, required: true }, // string or string[]
  title: { type: String },
  metadata: { type: DerivedMetadataSchema },
  status: {
    type: String,
    enum: ['generated', 'edited', 'published'],
    default: 'generated'
  },
  publishedTo: { type: PublishedToSchema }
}, {
  timestamps: true
});

DerivedContentSchema.index({ parentContentId: 1 });
DerivedContentSchema.index({ format: 1 });
DerivedContentSchema.index({ status: 1 });
DerivedContentSchema.index({ createdAt: -1 });

export const DerivedContent = mongoose.model<IDerivedContent>('DerivedContent', DerivedContentSchema);
