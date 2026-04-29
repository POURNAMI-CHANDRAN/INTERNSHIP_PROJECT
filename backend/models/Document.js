import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
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

export default mongoose.model("Document", DocumentSchema);


