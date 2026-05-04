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

export async function askBrain(question) {
  try {
    const intent = detectIntent(question);
    const entities = parseEntities(question);
    const rag = await askRAG(question);

    const context = buildContext(question, entities, rag);

    switch (intent) {

      /* ================= BENCH ================= */
      case "BENCH_ANALYSIS": {
        const data = rag.contextUsed;

        return {
          intent,
          answer: `Bench Analysis Completed for ${data.length} employees`,
          data: {
            summary: data,
            insight:
              data.length > 3
                ? "High Bench Risk Detected"
                : "Normal Workforce Distribution",
          },
        };
      }

      /* ================= FORECASTING ================= */

      case "REVENUE_FORECAST": {
        return {
          intent,
          answer: "Revenue Forecast Generated",
          data: await forecastRevenue({
            ...context,
            months: getLastNMonths(6),
          }),
        };
      }

      case "BENCH_FORECAST": {
        return {
          intent,
          answer: "Bench Forecast Generated",
          data: await forecastBench({
            ...context,
            months: getLastNMonths(6),
          }),
        };
      }

      case "UTILIZATION_FORECAST": {
        return {
          intent,
          answer: "Utilization Forecast Generated",
          data: await forecastUtilization({
            ...context,
            months: getLastNMonths(6),
          }),
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

      /* ================= TALENT SEARCH ================= */

      case "TALENT_SEARCH": {
        return await searchTalent(question, entities);
      }

      /* ================= RECOMMENDATION ================= */

      case "RESOURCE_RECOMMENDATION": {
        return {
          intent,
          answer: "Best Matching Resources Found",
          data: await recommendResources(question, rag.contextUsed),
        };
      }

      /* ================= DEFAULT (RAG INTELLIGENCE) ================= */

      default: {
        return {
          intent: "GENERAL_RAG",
          answer:
            rag.answer && rag.answer.length > 0
              ? rag.answer
              : "No strong contextual insights found",
          data: rag.contextUsed,
        };
      }
    }
  } catch (err) {
    console.error("Brain Error:", err);

    return {
      intent: "ERROR",
      answer: "AI Brain failed to process request",
      data: [],
    };
  }
}

