import mongoose from "mongoose";

/* ================= HELPERS ================= */

function applyLifecycleFlags(doc) {

  if (doc.status === "ACTIVE") {
    doc.allowAllocations = true;
    doc.allowMoves = true;

  } else if (doc.status === "ON_HOLD") {
    doc.allowAllocations = false;
    doc.allowMoves = true;

  } else {
    doc.allowAllocations = false;
    doc.allowMoves = false;
  }
}

function normalizeBilling(doc) {

  if (doc.type === "Non-Billable") {
    doc.billingRate = 0;
    doc.fixedMonthlyRevenue = 0;
    return;
  }

  if (doc.billingModel === "Fixed") {
    doc.billingRate = 0;
  }

  if (doc.billingModel === "Hourly") {
    doc.fixedMonthlyRevenue = 0;
  }
}

/* ================= SCHEMA ================= */

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["Billable", "Non-Billable"],
      required: true,
    },

  billingModel: {
    type: String,
    enum: ["Hourly", "Fixed", null],
    default: null,
  },

    billingRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    billingCurrency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR"
    },

    fixedMonthlyRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    targetFTE: {
      type: Number,
      default: 0,
      min: 0,
    },

    startMonth: {
      type: String,
      required: true,
    },

    startYear: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PLANNED",
        "ACTIVE",
        "ON_HOLD",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PLANNED",
    },

    allowAllocations: {
      type: Boolean,
      default: false,
    },

    allowMoves: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ================= CREATE ================= */
projectSchema.pre("save", function () {
  normalizeBilling(this);
  applyLifecycleFlags(this);

  if (
    this.type === "Billable" &&
    this.billingModel === "Hourly" &&
    this.billingRate <= 0
  ) {
    throw new Error("Hourly projects require billingRate");
  }

  if (
    this.type === "Billable" &&
    this.billingModel === "Fixed" &&
    this.fixedMonthlyRevenue <= 0
  ) {
    throw new Error("Fixed projects require fixedMonthlyRevenue");
  }
});

/* ================= UPDATE ================= */

projectSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  const data = update.$set || update;

  normalizeBilling(data);

  if (data.status) {
    applyLifecycleFlags(data);
  }

  if (
    data.type === "Billable" &&
    data.billingModel === "Hourly" &&
    Number(data.billingRate || 0) <= 0
  ) {
    throw new Error("Hourly Projects require Billing Rate");
  }

  if (
    data.type === "Billable" &&
    data.billingModel === "Fixed" &&
    Number(data.fixedMonthlyRevenue || 0) <= 0
  ) {
    throw new Error("Fixed Projects require Fixed Monthly Revenue");
  }

  if (update.$set) {
    update.$set = data;
  }

  this.setUpdate(update);
});


projectSchema.path("billingModel").validate(function(value) {

  if (this.type === "Billable" && !value) {
    return false;
  }

  return true;

}, "Billable Projects require Billing Model");
/* ================= VIRTUAL ================= */

projectSchema.virtual("targetHours").get(function () {
  return (this.targetFTE || 0) * 160;
});

/* ================= EXPORT ================= */

export default mongoose.model("Project", projectSchema);