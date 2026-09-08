import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITweet {
  tweetNumber: number;
  content: string;
}

export interface IContentModeration {
  status: "approved" | "flagged" | "rejected";
  safetyScore: number; // 0 - 100
  riskLevel: "low" | "medium" | "high";
  flags: {
    hateSpeech: boolean;
    harassment: boolean;
    sexuallyExplicit: boolean;
    dangerousContent: boolean;
    spamScam: boolean;
  };
  reason: string;
  analyzedAt: Date;
  autoModerated: boolean;
}

export interface IRepurposeJob extends Document {
  userEmail?: string;
  sourceType: "youtube" | "article" | "raw_text";
  sourceUrl?: string;
  sourceTitle: string;
  originalContent: string;
  tone: string;
  linkedinPost: {
    content: string;
    hashtags: string[];
  };
  twitterThread: ITweet[];
  newsletter?: {
    subject: string;
    previewText: string;
    content: string;
  };
  keyTakeaways: string[];
  moderation?: IContentModeration;
  createdAt: Date;
  updatedAt: Date;
}

const TweetSchema = new Schema<ITweet>({
  tweetNumber: { type: Number, required: true },
  content: { type: String, required: true },
});

const RepurposeJobSchema = new Schema<IRepurposeJob>(
  {
    userEmail: { type: String, index: true },
    sourceType: {
      type: String,
      enum: ["youtube", "article", "raw_text"],
      required: true,
    },
    sourceUrl: { type: String },
    sourceTitle: { type: String, required: true },
    originalContent: { type: String, required: true },
    tone: { type: String, default: "professional" },
    linkedinPost: {
      content: { type: String, required: true },
      hashtags: [{ type: String }],
    },
    twitterThread: [TweetSchema],
    newsletter: {
      subject: { type: String },
      previewText: { type: String },
      content: { type: String },
    },
    keyTakeaways: [{ type: String }],
    moderation: {
      status: {
        type: String,
        enum: ["approved", "flagged", "rejected"],
        default: "approved",
        index: true,
      },
      safetyScore: { type: Number, default: 98, index: true },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
      },
      flags: {
        hateSpeech: { type: Boolean, default: false },
        harassment: { type: Boolean, default: false },
        sexuallyExplicit: { type: Boolean, default: false },
        dangerousContent: { type: Boolean, default: false },
        spamScam: { type: Boolean, default: false },
      },
      reason: {
        type: String,
        default: "Nội dung an toàn, đạt chuẩn xuất bản tự động.",
      },
      analyzedAt: { type: Date, default: Date.now },
      autoModerated: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const RepurposeJob: Model<IRepurposeJob> =
  mongoose.models.RepurposeJob ||
  mongoose.model<IRepurposeJob>("RepurposeJob", RepurposeJobSchema);
