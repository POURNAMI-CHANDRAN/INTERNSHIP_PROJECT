import mongoose from "mongoose";

const AIDocumentSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ["employee", "project", "allocation"],
      required: true
    },

    sourceId: {
      type: String,
      required: true,
      index: true
    },

    text: {
      type: String,
      required: true
    },

    embedding: {
      type: [Number],
      required: true
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

// ⚡ IMPORTANT: Helps filtering + performance
AIDocumentSchema.index({ sourceType: 1, sourceId: 1 });

export default mongoose.model(
  "AIDocument",
  AIDocumentSchema,
  "ai_documents"
);