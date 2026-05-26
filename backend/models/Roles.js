import mongoose from "mongoose";

const roleschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: [/^[A-Za-z0-9\s/&().,-]+$/, "Only Letters and Spaces Allowed"]
  },

  description: String,

  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    default: null
  }
}, 
{ 
  timestamps: true 
});

export default mongoose.model("Roles", roleschema);