import axios from "axios";
import Allocation from "../models/Allocation.js";
import Employee from "../models/Employee.js";
import Billing from "../models/Billing.js";

/* ================= CONFIG ================= */
const HOURLY_RATE = 600;
const MONTHLY_CAPACITY = 160;

/* ================= AI COPILOT ================= */

export const askAI = async (req, res) => {
  try {
    const { question } = req.body;
    const q = question.toLowerCase();

    /* =====================================================
       🔥 BENCH INTELLIGENCE (CORE COPILOT FEATURE)
    ===================================================== */
    if (q.includes("bench") || q.includes("who is on bench")) {
      const data = await Allocation.aggregate([
        {
          $group: {
            _id: "$employee",
            billable: {
              $sum: {
                $cond: [{ $eq: ["$isBillable", true] }, "$fte", 0]
              }
            },
            total: { $sum: "$fte" }
          }
        },
        {
          $lookup: {
            from: "employees",
            localField: "_id",
            foreignField: "_id",
            as: "emp"
          }
        },
        { $unwind: "$emp" }
      ]);

      const bench = data.filter(e => e.billable === 0);

      const insights = bench.map(e => {
        const benchHours = MONTHLY_CAPACITY;
        const revenueImpact = benchHours * HOURLY_RATE;

        let reason = "No billable allocation";
        if (e.total > 0) reason = "Only internal/shadow work";

        let risk = "HIGH";
        if (e.billable > 0) risk = "MEDIUM";

        return {
          employee: e.emp.name,
          employeeId: e.emp._id,
          reason,
          risk,
          benchHours,
          revenueImpact,
          recommendation: "Assign to active billable project immediately",
        };
      });

      return res.json({
        answer: `Found ${bench.length} employees on bench with risk analysis`,
        insights,
      });
    }

    /* =====================================================
       📉 UNDERUTILIZATION INTELLIGENCE
    ===================================================== */
    if (q.includes("underutilized") || q.includes("low utilization")) {
      const data = await Allocation.aggregate([
        {
          $group: {
            _id: "$employee",
            billable: {
              $sum: {
                $cond: [{ $eq: ["$isBillable", true] }, "$fte", 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: "employees",
            localField: "_id",
            foreignField: "_id",
            as: "emp"
          }
        },
        { $unwind: "$emp" }
      ]);

      const underutilized = data.filter(e => e.billable < 80);

      return res.json({
        answer: `Found ${underutilized.length} underutilized employees`,
        insights: underutilized.map(e => ({
          employee: e.emp.name,
          utilization: e.billable,
          risk: e.billable < 40 ? "HIGH" : "MEDIUM",
          recommendation: "Increase project allocation"
        }))
      });
    }

    /* =====================================================
       💰 REVENUE INTELLIGENCE
    ===================================================== */
    if (q.includes("revenue")) {
      const data = await Billing.aggregate([
        {
          $group: {
            _id: "$project_id",
            revenue: { $sum: "$total_revenue" }
          }
        },
        { $sort: { revenue: -1 } }
      ]);

      return res.json({
        answer: "Revenue analysis completed",
        insights: data.map(d => ({
          projectId: d._id,
          revenue: d.revenue
        }))
      });
    }

    /* =====================================================
       🎯 SMART ALLOCATION SUGGESTION ENGINE
    ===================================================== */
    if (q.includes("allocate") || q.includes("suggest")) {
      const employees = await Allocation.aggregate([
        {
          $group: {
            _id: "$employee",
            billable: {
              $sum: {
                $cond: [{ $eq: ["$isBillable", true] }, "$fte", 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: "employees",
            localField: "_id",
            foreignField: "_id",
            as: "emp"
          }
        },
        { $unwind: "$emp" }
      ]);

      const projects = await Billing.distinct("project_id");

      const suggestions = employees
        .filter(e => e.billable < 120)
        .slice(0, 5)
        .map((e, i) => ({
          employee: e.emp.name,
          projectId: projects[i] || "TBD",
          suggestedHours: 40,
          reason: "Available capacity + optimization opportunity"
        }));

      return res.json({
        answer: "Smart allocation suggestions generated",
        insights: suggestions
      });
    }

    /* =====================================================
       🧠 FALLBACK LLM (OLLAMA)
    ===================================================== */
    const ollamaRes = await axios.post(
      "http://127.0.0.1:11434/api/generate",
      {
        model: "llama3",
        prompt: `You are a workforce AI copilot.
Answer clearly and concisely:

${question}`,
        stream: false
      }
    );

    res.json({
      answer: ollamaRes.data.response,
      insights: []
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};