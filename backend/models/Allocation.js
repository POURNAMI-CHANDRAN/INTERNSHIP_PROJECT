import mongoose from "mongoose";

const MONTHLY_CAPACITY = 160;

const allocationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    workCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkCategory",
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    allocatedHours: {
      type: Number,
      default: 0,
      min: 0,
      max: MONTHLY_CAPACITY,
    },

    allocationFTE: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },

    isBillable: {
      type: Boolean,
      default: true,
    },

    billingType: {
      type: String,
      enum: ["Billable", "Shadow", "Non-Billable"],
      default: "Billable",
    },

    startDate: Date,
    endDate: Date,

    // 🔥 Rate per hour (snapshot at allocation time)
    rateSnapshot: {
      type: Number,
      required: true,
      default: 0,
    },

    // 🔥 Total revenue for THIS allocation
    revenue: {
      type: Number,
      default: 0,
    },

    cost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* =========================================================
   CORE BUSINESS LOGIC (CRITICAL)
========================================================= */
allocationSchema.pre("validate", function () {
  const CAPACITY = 160;

  // ===============================
  // 1. SAFE ZERO HANDLING
  // ===============================
  const hasHours = this.allocatedHours > 0;
  const hasFTE = this.allocationFTE > 0;

  // if both are 0 → keep as draft allocation
  if (!hasHours && !hasFTE) {
    this.allocatedHours = 0;
    this.allocationFTE = 0;
    this.revenue = 0;
    this.rateSnapshot = 0;
    return;
  }

  // ===============================
  // 2. NORMALIZE FTE ↔ HOURS
  // ===============================
  if (hasFTE && !hasHours) {
    this.allocatedHours = Number((this.allocationFTE * CAPACITY).toFixed(2));
  }

  if (hasHours && !hasFTE) {
    this.allocationFTE = Number((this.allocatedHours / CAPACITY).toFixed(4));
  }

  // ===============================
  // 3. BILLING FLAG
  // ===============================
  this.isBillable = this.billingType === "Billable";

  // ===============================
  // 4. REVENUE RULES
  // ===============================
  if (!this.isBillable) {
    this.revenue = 0;
    this.rateSnapshot = 0;
    return;
  }
});


export default mongoose.model("Allocation", allocationSchema);