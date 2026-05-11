import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  getBenchResources,
} from "../controllers/benchController.js";

const router = express.Router();

router.get("/", protect, getBenchResources);

export default router;