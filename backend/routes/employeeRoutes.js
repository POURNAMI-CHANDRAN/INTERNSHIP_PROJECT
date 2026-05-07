import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getMyProfile,
  getFullEmployeeDetails,
  getAllEmployeesReport
} from "../controllers/employeeController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("Admin", "Finance"),
  createEmployee
);

router.get("/me", protect, getMyProfile);

router.get(
  "/reports",
  protect,
  authorize("Admin", "Finance"),
  getAllEmployeesReport
);

router.get(
  "/:id/full-details",
  protect,
  authorize("Admin", "Finance"),
  getFullEmployeeDetails
);

router.get(
  "/",
  protect,
  authorize("Admin", "Finance", "Manager"),
  getEmployees
);

router.get(
  "/:id",
  protect,
  authorize("Admin", "Finance", "Manager"),
  getEmployeeById
);

router.put(
  "/:id",
  protect,
  authorize("Admin", "Finance"),
  updateEmployee
);

router.delete(
  "/:id",
  protect,
  authorize("Admin", "Finance"),
  deleteEmployee
);


export default router;