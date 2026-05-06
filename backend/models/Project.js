import mongoose from "mongoose";

/* ================= LIFECYCLE HELPER ================= */
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

/* ================= BILLING DATA FIX ================= */
function normalizeBilling(doc) {
  if (
    doc.billingModel === "Billable" ||
    doc.billingModel === "Non-Billable"
  ) {
    doc.type = doc.billingModel;
    doc.billingModel = "Hourly"; // safe default
  }

  /* Non-Billable should never carry revenue */
  if (doc.type === "Non-Billable") {
    doc.billingRate = 0;
    doc.fixedMonthlyRevenue = 0;
  }

  /* Fixed model should not use hourly */
  if (doc.billingModel === "Fixed") {
    doc.billingRate = 0;
  }

  /* Hourly model should not use monthly */
  if (doc.billingModel === "Hourly") {
    doc.fixedMonthlyRevenue = 0;
  }
}

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    /* BUSINESS TYPE */
    type: {
      type: String,
      enum: ["Billable", "Non-Billable"],
      required: true,
    },

    /* PRICING MODEL */
    billingModel: {
      type: String,
      enum: ["Hourly", "Fixed"],
      default: "Hourly",
    },

    billingRate: {
      type: Number,
      min: 0,
      default: 0,
    },

    targetFTE: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    fixedMonthlyRevenue: {
      type: Number,
      min: 0,
      default: 0,
    },

    startDate: { type: Date, required: true },
    endDate: Date,

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
  { timestamps: true }
);

/* ================= CREATE ================= */
projectSchema.pre("save", function () {
  normalizeBilling(this);
  applyLifecycleFlags(this);
});

/* ================= UPDATE ================= */
projectSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  normalizeBilling(update);

  if (update.status) {
    applyLifecycleFlags(update);
  }

  this.setUpdate(update);
});


projectSchema.virtual("targetHours").get(function () {
  return (this.targetFTE || 0) * 160;
});


export default mongoose.model("Project", projectSchema);