import mongoose from "mongoose";

/* ================= EMPLOYEE SKILL SCHEMA ================= */

const employeeSkillSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= UNIQUE COMPOUND INDEX ================= */
employeeSkillSchema.index(
  { employeeId: 1, skillId: 1 },
  { unique: true }
);

/* ================= EXPORT ================= */
export default mongoose.model("EmployeeSkill", employeeSkillSchema);