import crypto from "crypto";
import User from "../models/User.js";

// ======================================
// GET ALL USERS
// ======================================

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("employeeId");

    res.json({
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ======================================
// CREATE USER + INVITE FLOW
// ======================================

export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      employeeId,
    } = req.body;

    // =========================
    // CHECK EXISTING USER
    // =========================

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User Already Exists",
      });
    }

    // =========================
    // GENERATE INVITE TOKEN
    // =========================

    const inviteToken = crypto
      .randomBytes(32)
      .toString("hex");

    const inviteExpires = new Date(
      Date.now() + 1000 * 60 * 60 * 24 // 24h
    );

    // =========================
    // CREATE USER
    // =========================

    const user = await User.create({
      name,
      email,
      role,
      employeeId:
        role === "Employee"
          ? employeeId
          : null,

      status: "Pending",

      password: null,

      inviteToken,
      inviteExpires,

      isFirstLogin: true,
    });

    // =========================
    // INVITE URL
    // =========================

    const inviteUrl = `${process.env.FRONTEND_URL}/accept_invite/${inviteToken}`;

    // =========================
    // TODO: SEND EMAIL HERE
    // =========================

    console.log("INVITE URL:");
    console.log(inviteUrl);

    res.status(201).json({
      message:
        "User Invited Successfully",
      user,
      inviteUrl, // remove in production
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ======================================
// ACCEPT INVITE
// ======================================

export const acceptInvite = async (req, res) => {
  try {
    const {
      token,
      password,
    } = req.body;

    // =========================
    // FIND USER
    // =========================

    const user = await User.findOne({
      inviteToken: token,
      inviteExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        error:
          "Invalid or Expired Invite",
      });
    }

    // =========================
    // SET PASSWORD
    // =========================

    user.password = password;

    user.status = "Active";

    user.inviteToken = null;
    user.inviteExpires = null;

    user.isFirstLogin = false;

    await user.save();

    res.json({
      message:
        "Account Activated Successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ======================================
// UPDATE USER
// ======================================

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ======================================
// DELETE USER
// ======================================

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};