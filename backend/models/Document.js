import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  text: String,
  embedding: [Number], // vector stored in MongoDB
  metadata: {
    type: Object,
    default: {},
  },
});

export default mongoose.model("Document", DocumentSchema);