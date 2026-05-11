import mongoose from "mongoose";
import Billing from "./Billing.js";

// ─────────────────────────────────────────────
// Utility: Get Month Start
// ─────────────────────────────────────────────
function getMonthStart(date) {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

// ─────────────────────────────────────────────
// Auto Billing Regeneration Logic
// ─────────────────────────────────────────────
async function regenerateBilling(employee_id, project_id, work_date) {
  const start = getMonthStart(work_date);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  // Fetch APPROVED timesheets for this employee/project/month
  const timesheets = await mongoose.model("Timesheet").find({
    employee_id,
    project_id,
    status: "Approved",
    work_date: { $gte: start, $lt: end }
  });

  const totalPoints = timesheets.reduce(
    (sum, t) => sum + (t.story_points_completed || 0),
    0
  );

  // Find existing billing record
  let billing = await Billing.findOne({
    employee_id,
    project_id,
    billing_month: start
  });

  const oldRevenue = billing ? billing.total_revenue : 0;
  const rate = billing ? billing.billing_rate_per_point : 120;
  const newRevenue = totalPoints * rate;

  if (!billing) {
    // Create new billing entry
    billing = await Billing.create({
      employee_id,
      project_id,
      billing_month: start,
      story_points_completed: totalPoints,
      billing_rate_per_point: rate,
      total_revenue: newRevenue
    });
  } else {
    // Update existing billing
    billing.story_points_completed = totalPoints;
    billing.total_revenue = newRevenue;
    await billing.save();
  }

  // ──────────────────────────────────────
  // Email Notification Placeholder
  // ──────────────────────────────────────
  console.log(
    `EMAIL TO ADMIN → Billing updated for Employee ${employee_id}, Project ${project_id}: Revenue ${oldRevenue} → ${newRevenue}`
  );

  // ──────────────────────────────────────
  // Audit Log
  // ──────────────────────────────────────
  console.log(
    `AUDIT LOG → Billing auto-updated from ${oldRevenue} to ${newRevenue} for employee ${employee_id} on project ${project_id}`
  );
}

// ─────────────────────────────────────────────
// Timesheet Schema Definition
// ─────────────────────────────────────────────
const timesheetSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    story_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bench",
      required: true
    },

    story_points_completed: { type: Number, required: true },
    work_date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },

    audit: {
      created_by: String,
      updated_by: String
    }
  },
  { timestamps: true }
);

// Prevent duplicates (same employee + story + date)
timesheetSchema.index(
  { employee_id: 1, story_id: 1, work_date: 1 },
  { unique: true }
);

// ─────────────────────────────────────────────
// POST-SAVE (Triggers for status changes, new entries)
// ─────────────────────────────────────────────
timesheetSchema.post("save", async function (doc) {
  if (doc.status === "Approved") {
    await regenerateBilling(doc.employee_id, doc.project_id, doc.work_date);
  }
});

// ─────────────────────────────────────────────
// POST-UPDATE (Triggers for story point edits, reassignment)
// ─────────────────────────────────────────────
timesheetSchema.post("findOneAndUpdate", async function (result) {
  if (!result) return;

  const updated = await mongoose.model("Timesheet").findById(result._id);
  if (!updated) return;

  await regenerateBilling(
    updated.employee_id,
    updated.project_id,
    updated.work_date
  );
});

export default mongoose.model("Timesheet", timesheetSchema);