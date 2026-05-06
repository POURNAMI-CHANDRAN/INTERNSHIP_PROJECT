import express from "express";
import {
  getProjects,
  createProject,
  updateProject,
  changeProjectStatus,
  archiveProject,
  updateTargetFTE
} from "../controllers/projectController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= READ ================= */
router.get("/", protect, authorize("Admin", "Finance", "Manager"), getProjects);

/* ================= CREATE ================= */
router.post("/", protect, authorize("Admin", "Finance"), createProject);

/* ================= UPDATE DATA ================= */
router.patch(
  "/:id",
  protect,
  authorize("Admin", "Finance"),
  updateProject
);

/* ================= STATUS CHANGE ================= */
router.patch(
  "/:id/status",
  protect,
  authorize("Admin", "Finance"),
  changeProjectStatus
);

/* ================= ARCHIVE ================= */
router.delete(
  "/:id",
  protect,
  authorize("Admin"),
  archiveProject
);

/* ================= UPDATE TARGET FTE ================= */
router.put(
  "/:id/target_fte",
  protect,
  authorize("Admin", "Finance"),
  updateTargetFTE
);

export default router;