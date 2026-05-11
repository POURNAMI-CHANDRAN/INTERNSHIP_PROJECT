import express from "express";
import {
  createSkill,
  getSkills,
  // updateSkill,
  deleteSkill,
  restoreSkill,
} from "../controllers/SkillController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

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

// /* ---------------- UPDATE ---------------- */
// router.patch(
//   "/:id",
//   protect,
//   authorize("Admin", "Finance"),
//   updateSkill
// );

/* ---------------- DELETE ---------------- */
router.delete(
  "/:id",
  protect,
  authorize("Admin", "Finance"),
  deleteSkill
);

/* ---------------- RESTORE ---------------- */
router.patch(
  "/restore/:id",
  protect,
  authorize("Admin", "Finance"),
  restoreSkill
);

export default router;