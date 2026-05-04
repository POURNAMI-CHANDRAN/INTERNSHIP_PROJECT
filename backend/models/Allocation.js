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
  /* ================= SYNC HOURS & FTE ================= */

  if ((!this.allocatedHours || this.allocatedHours === 0) && this.allocationFTE > 0) {
    this.allocatedHours = Number(
      (this.allocationFTE * MONTHLY_CAPACITY).toFixed(2)
    );
  }

  if ((!this.allocationFTE || this.allocationFTE === 0) && this.allocatedHours > 0) {
    this.allocationFTE = Number(
      (this.allocatedHours / MONTHLY_CAPACITY).toFixed(4)
    );
  }

  /* ================= BILLING LOGIC ================= */

  if (this.billingType === "Billable") {
    this.isBillable = true;
  } else {
    this.isBillable = false;
  }

  /* ================= REVENUE CALCULATION ================= */

  if (!this.isBillable) {
    this.rateSnapshot = 0;
    this.revenue = 0;
  } else {
    // 💡 CORE FORMULA
    this.revenue = Number(
      (this.allocatedHours * this.rateSnapshot).toFixed(2)
    );
  }
});

export default mongoose.model("Allocation", allocationSchema);