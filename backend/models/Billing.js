import mongoose from "mongoose";

const billingSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  month: Number,
  year: Number,
  total_hours: Number,
  rate_per_hour: Number,
  total_revenue: Number,
});

export default mongoose.model("Billing", billingSchema);