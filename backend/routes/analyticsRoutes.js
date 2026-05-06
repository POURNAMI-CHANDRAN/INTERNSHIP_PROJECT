// import express from "express";
// import {
//   getUtilization,
//   getBench,
//   getRevenue,
//   getProjectHealth,
//   getBenchForecast,
//   getMoveSuggestions,
// } from "../controllers/analyticsController.js";

// import { protect, authorize } from "../middleware/authMiddleware.js";

// const router = express.Router();

// /* =====================================================
//    ANALYTICS & DECISION ENGINES
// ===================================================== */

// // Utilization & Bench
// router.get(
//   "/utilization",
//   protect,
//   authorize("Admin", "Finance", "Manager"),
//   getUtilization
// );

// router.get(
//   "/bench",
//   protect,
//   authorize("Admin", "Finance", "Manager"),
//   getBench
// );

// // Revenue
// router.get(
//   "/revenue",
//   protect,
//   authorize("Admin", "Finance"),
//   getRevenue
// );

// // Project Health
// router.get(
//   "/projects/health",
//   protect,
//   authorize("Admin", "Finance", "Manager"),
//   getProjectHealth
// );

// // Forecast
// router.get(
//   "/forecast/bench",
//   protect,
//   authorize("Admin", "Finance", "Manager"),
//   getBenchForecast
// );

// // AI‑like Suggestions
// router.get(
//   "/suggestions/moves",
//   protect,
//   authorize("Admin", "Manager"),
//   getMoveSuggestions
// );

// export default router;

import express from "express";
import {
  getEnterpriseDashboard
} from "../controllers/analyticsController.js";

const router = express.Router();

/* ================= BI DASHBOARD ================= */
router.get("/dashboard", getEnterpriseDashboard);

export default router;