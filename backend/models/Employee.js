import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roles",
      required: true,
    },

    primaryWorkCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkCategory",
      required: true,
    },

    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],

    hourlyCost: {
      type: Number,
      default: 0,
    },

    billingRate: {
      type: Number,
      default: 0,
    },

    billingCurrency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },

    monthlySalary: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    /* ================= NEW HR FIELDS ================= */

    joiningDate: {
      type: Date,
      required: false,
    },

    location: {
      type: String,
      trim: true,
      required: false,
    },
  },
  { timestamps: true }
);

employeeSchema.pre("save", function () {
  if (this.monthlySalary > 0) {
    this.hourlyCost = Number((this.monthlySalary / 160).toFixed(2));
  }
});

employeeSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  const salary =
    update.monthlySalary ??
    update?.$set?.monthlySalary;

  if (salary > 0) {
    if (!update.$set) update.$set = {};
    update.$set.hourlyCost = Number((salary / 160).toFixed(2));
    this.setUpdate(update);
  }
});

export default mongoose.model("Employee", employeeSchema);