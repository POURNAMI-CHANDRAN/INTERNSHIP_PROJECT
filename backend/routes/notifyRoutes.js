import express from "express";

import Notification from "../models/Notification.js";

const router = express.Router();

/* ---------------- GET NOTIFICATIONS ---------------- */

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Failed to Fetch Notifications",
    });
  }
});

/* ---------------- TEST NOTIFICATIONS ---------------- */
router.post("/test", async (req, res) => {
  try {
    const io = req.app.get("io");

    const notification = await Notification.create({
      title: "Test Notification",
      message: "Realtime Notification Working 🚀",
      type: "info",
    });

    io.emit("new_notification", notification);

    res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const notification =
      await Notification.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true }
      );

    res.json({
      success: true,
      data: notification,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
    });
  }
});

export default router;