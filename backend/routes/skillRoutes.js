import express from "express";
import {
  createSkill,
  getSkills,
  getSkillCategories,
  // updateSkill,
  deleteSkill,
  restoreSkill,
} from "../controllers/SkillController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------- GET SKILL CATEGORIES ---------------- */
router.get("/categories/all", getSkillCategories);

/* ---------------- GET ---------------- */
router.get(
  "/",
  protect,
  authorize("Admin", "Finance", "Manager"),
  getSkills
);

/* ---------------- CREATE ---------------- */
router.post(
  "/",
  protect,
  authorize("Admin", "Finance"),
  createSkill
);

/* ---------------- DELETE ---------------- */
router.delete(
  "/:id",
  protect,
  authorize("Admin", "Finance"),
  deleteSkill
);

/* ---------------- RESTORE ---------------- */
router.patch(
  "/:id/restore",
  protect,
  authorize("Admin", "Finance"),
  restoreSkill
);

export default router;