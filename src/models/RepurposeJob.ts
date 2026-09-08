import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITweet {
  tweetNumber: number;
  content: string;
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
  },
  {
    timestamps: true,
  }
);

export const RepurposeJob: Model<IRepurposeJob> =
  mongoose.models.RepurposeJob ||
  mongoose.model<IRepurposeJob>("RepurposeJob", RepurposeJobSchema);
