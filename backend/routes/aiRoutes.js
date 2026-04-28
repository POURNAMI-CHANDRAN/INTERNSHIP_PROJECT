import express from "express";
import { askAI } from "../controllers/aiController.js";

const router = express.Router();

/* =====================================================
   MAIN AI COPILOT ROUTE
===================================================== */

/*
POST /api/ai/ask

Body Examples:

{
  "question": "show dashboard summary"
}

{
  "question": "who is on bench"
}

{
  "question": "suggest react developers",
  "skills": ["React", "Node", "MongoDB"]
}

{
  "question": "forecast revenue"
}

{
  "question": "executive summary",
  "month": 4,
  "year": 2026
}
*/

router.post("/ask", askAI);

/* =====================================================
   HEALTH CHECK
===================================================== */

router.get("/health", (req, res) => {
  return res.json({
    success: true,
    service: "AI Copilot API",
    status: "Running"
  });
});

export default router;