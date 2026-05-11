import mongoose from "mongoose";

const Benchchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    effort_type: {
      type: String,
      enum: ["FTE", "STORY_POINTS"],
      default: "FTE",
    },

    effort_value: {
      type: Number,
      required: true,
      min: 0.25,
    },

    hours_required: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["TO_DO", "IN_PROGRESS", "DONE"],
      default: "TO_DO",
    },

    assigned_employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true }
);

/* ✅ Auto‑calculate hours */
Benchchema.pre("save", function () {
  if (this.effort_type === "FTE") {
    this.hours_required = this.effort_value * 160;
  } else {
    this.hours_required = 0;
  }
});

export default mongoose.model("Bench", Benchchema);