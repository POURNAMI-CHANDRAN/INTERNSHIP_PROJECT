import { detectIntent } from "../utils/intentDetector.js";
import { parseEntities } from "./entityParser.js";
import { askRAG } from "./RAGService.js";

import { getDashboardSummary } from "./insightsService.js";
import { forecastRevenue } from "./forecastService.js";
import { recommendResources } from "./recommendationService.js";
import { searchTalent } from "./vectorService.js";

export async function askBrain(question) {
  try {
    const intent = detectIntent(question);
    const entities = parseEntities(question);

    // 🔥 ALWAYS RUN RAG FIRST
    const rag = await askRAG(question);

    switch (intent) {

      case "BENCH_ANALYSIS":
        return {
          intent,
          answer: "Bench analysis completed",
          data: rag.contextUsed
        };

      case "REVENUE_FORECAST":
        return {
          intent,
          answer: "Revenue forecast generated",
          data: await forecastRevenue()
        };

        case "DASHBOARD":
        return {
            intent,
            answer: "Dashboard Summary Ready",
            data: await getDashboardSummary({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
            })
        };
      case "TALENT_SEARCH":
        return await searchTalent(question, entities);

      case "RESOURCE_RECOMMENDATION":
        return {
          intent,
          answer: "Best matching resources found",
          data: await recommendResources(question, rag.contextUsed)
        };

      default:
        return {
          intent: "GENERAL_RAG",
          answer: rag.answer,
          data: rag.contextUsed
        };
    }

  } catch (err) {
    console.error("Brain Error:", err);
    return {
      intent: "ERROR",
      answer: "AI Brain failed",
      data: []
    };
  }
}