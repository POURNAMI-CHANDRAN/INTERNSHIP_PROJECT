/* ================= AI BRAIN (CORRECTED PRODUCTION VERSION) ================= */

import { detectIntent } from "../utils/intentDetector.js";
import { parseEntities } from "./entityParser.js";
import { askRAG } from "./RAGService.js";

import { getDashboardSummary } from "./insightsService.js";
import { forecastRevenue } from "./forecastService.js";
import { forecastBench } from "./forecastService.js";
import { forecastUtilization } from "./forecastService.js";
import { recommendResources } from "./recommendationService.js";
import { searchTalent } from "./vectorService.js";
import { getMonthData } from "./analyticsService.js";

/* ================= TIME CONTEXT ================= */

const getLastNMonths = (n = 6) => {
  const res = [];
  const now = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  return res;
};

const buildContext = (question, entities, rag) => ({
  question,
  entities,
  rag: rag.contextUsed,
  knowledge: rag.answer,
  time: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
});

/* ================= BRAIN ENGINE ================= */

/* ================= AI BRAIN (CORRECTED PRODUCTION VERSION) ================= */

export async function askBrain(question) {
  try {
    const intent = detectIntent(question);
    const entities = parseEntities(question);
    const rag = await askRAG(question);

    const context = buildContext(question, entities, rag);

    const effectiveTime = {
    month: entities.month ?? context.time.month,
    year: entities.year ?? context.time.year,
  };

    switch (intent) {

      /* ================= UNDERUTILIZATION ✅ ADD THIS ================= */

      case "UNDERUTILIZATION": {
        const { employeeMetrics } = await getMonthData(context.time);

        const underutilized = employeeMetrics.filter(
          e => e.utilizationBand === "UNDERUTILIZED"
        );

        return {
          intent,
          answer: `${underutilized.length} employees are underutilized`,
          results: underutilized,
        };
      }

      /* ================= EMPLOYEES BY LOCATION ================= */

      case "EMPLOYEE_LOCATION_SEARCH": {
        const { employeeMetrics } = await getMonthData(context.time);
        const location = context.entities.location;

        const matches = employeeMetrics.filter(
          e => String(e.location || "").toLowerCase() === location
        );

        return {
          intent,
          answer: `${matches.length} employees found in ${location.toUpperCase()}`,
          results: matches,
        };
      }

      /* ================= ALL EMPLOYEES ================= */

      case "EMPLOYEE_LIST": {
        const { employeeMetrics } = await getMonthData(context.time);

        return {
          intent,
          answer: `${employeeMetrics.length} employees found`,
          results: employeeMetrics,
        };
      }

      /* ================= BENCH BY LOCATION ================= */

      case "BENCH_LOCATION_SEARCH": {
        const { employeeMetrics } = await getMonthData(context.time);
        const location = context.entities.location;

        const matches = employeeMetrics.filter(
          e =>
            e.isBench === true &&
            String(e.location || "").toLowerCase() === location
        );

        return {
          intent,
          answer: `${matches.length} bench employees found in ${location.toUpperCase()}`,
          results: matches,
        };
      }
      /* ================= BENCH ================= */

      case "BENCH_ANALYSIS": {
        const { employeeMetrics } = await getMonthData(effectiveTime);
        const bench = employeeMetrics.filter(e => e.isBench);

        return {
          intent,
          answer: `Bench Analysis Completed for ${bench.length} employees`,
          results: bench,
        };
      }

      /* ================= DASHBOARD ================= */

      case "DASHBOARD": {
        return {
          intent,
          answer: "Dashboard Summary Ready",
          data: await getDashboardSummary(context.time),
        };
      }

      /* ================= RECOMMENDATION ================= */

      case "RESOURCE_RECOMMENDATION": {
        return {
          intent,
          answer: "Best Matching Resources Found",
          data: await recommendResources(question, rag.contextUsed),
        };
      }

      /* ================= DEFAULT ================= */

      default: {
        return {
          intent: "GENERAL_RAG",
          answer:
            rag.answer && rag.answer.length > 0
              ? rag.answer
              : "No strong contextual insights found",
          results: [],
        };
      }
    }
  } catch (err) {
    console.error("Brain Error:", err);

    return {
      intent: "ERROR",
      answer: "AI Brain failed to process request",
      results: [],
    };
  }
}

      /* ================= DEFAULT (RAG INTELLIGENCE) ================= */
