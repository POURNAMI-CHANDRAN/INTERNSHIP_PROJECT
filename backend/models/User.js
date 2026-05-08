import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
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
      trim: true,
    },

    // password optional until invite accepted
    password: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["Admin", "Finance", "Manager", "Employee"],
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,

      validate: {
        validator: function (value) {
          // Employee role MUST have employeeId
          if (this.role === "Employee") {
            return value != null;
          }

          return true;
        },

        message: "Employee role must have employeeId",
      },
    },

    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive"],
      default: "Pending",
    },

    // ==============================
    // INVITE FLOW
    // ==============================

    inviteToken: {
      type: String,
      default: null,
    },

    inviteExpires: {
      type: Date,
      default: null,
    },

    isFirstLogin: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


// =======================================
// HASH PASSWORD
// =======================================

userSchema.pre("save", async function () {

  // skip if password unchanged
  if (!this.isModified("password")) {
    return;
  }

  // skip if password empty
  if (!this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );
});


// =======================================
// REMOVE SENSITIVE FIELDS
// =======================================

userSchema.set("toJSON", {
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.inviteToken;
    delete ret.inviteExpires;

    return ret;
  },
});


// =======================================
// PASSWORD MATCH METHOD
// =======================================

userSchema.methods.matchPassword =
  async function (enteredPassword) {

    if (!this.password) {
      return false;
    }

    return await bcrypt.compare(
      enteredPassword,
      this.password
    );
  };


export default mongoose.model("User", userSchema);