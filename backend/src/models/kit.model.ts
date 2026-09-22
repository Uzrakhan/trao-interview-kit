import mongoose, { Document, Schema } from "mongoose";
import type { Kit } from "../schemas/kit.schema.js";

export interface IKit extends Document {
  userId: mongoose.Types.ObjectId;
  status: "generating" | "completed" | "failed";
  stage: string;
  input: {
    jd: string;
    companyUrl: string;
    days: number;
    location: string;
  };
  kit?: Kit;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const kitSchema = new Schema<IKit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["generating", "completed", "failed"],
      required: true,
      default: "generating",
    },

    stage: {
      type: String,
      required: true,
      default: "Starting generation",
    },

    input: {
      jd: { type: String, required: true },
      companyUrl: { type: String, required: true },
      days: { type: Number, required: true },
      location: { type: String, default: "" },
    },

    kit: {
      type: Schema.Types.Mixed,
    },

    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const KitModel = mongoose.model<IKit>("Kit", kitSchema);