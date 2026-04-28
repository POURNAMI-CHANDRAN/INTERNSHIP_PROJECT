// import { detectIntent } from "../utils/intentDetector.js";

// import {
//   getDashboardSummary,
//   getBenchInsights,
//   getUtilizationInsights,
//   getTopPerformers,
//   getProjectInsights,
//   getExecutiveSummary
// } from "../services/insightsService.js";

// import {
//   forecastRevenue,
//   forecastBench,
//   forecastUtilization,
//   forecastHiringDemand,
//   getForecastSummary
// } from "../services/forecastService.js";

// import {
//   recommendResources,
//   recommendBenchDeployment,
//   recommendLoadBalancing,
//   getRecommendationSummary
// } from "../services/recommendationService.js";

// import axios from "axios";

// /* =====================================================
//    HELPERS
// ===================================================== */
// const getMonthYear = req => {
//   const now = new Date();

//   return {
//     month:
//       Number(req.body.month) ||
//       now.getMonth() + 1,
//     year:
//       Number(req.body.year) ||
//       now.getFullYear()
//   };
// };

// const getHistoryMonths = () => {
//   const now = new Date();
//   const months = [];

//   for (let i = 5; i >= 0; i--) {
//     const d = new Date(
//       now.getFullYear(),
//       now.getMonth() - i,
//       1
//     );

//     months.push({
//       month: d.getMonth() + 1,
//       year: d.getFullYear()
//     });
//   }

//   return months;
// };

// /* =====================================================
//    MAIN AI COPILOT
// ===================================================== */
// export const askAI = async (
//   req,
//   res
// ) => {
//   try {
//     const question =
//       req.body.question || "";

//     const intent =
//       detectIntent(question);

//     const { month, year } =
//       getMonthYear(req);

//     const months =
//       getHistoryMonths();

//     /* =========================================
//        DASHBOARD
//     ========================================= */
//     if (intent === "DASHBOARD") {
//       const data =
//         await getDashboardSummary(
//           {
//             month,
//             year
//           }
//         );

//       return res.json({
//         answer:
//           "Dashboard summary generated",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        BENCH
//     ========================================= */
//     if (intent === "BENCH") {
//       const data =
//         await getBenchInsights({
//           month,
//           year
//         });

//       return res.json({
//         answer:
//           "Bench insights generated",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        UTILIZATION
//     ========================================= */
//     if (
//       intent ===
//       "UTILIZATION"
//     ) {
//       const data =
//         await getUtilizationInsights(
//           {
//             month,
//             year
//           }
//         );

//       return res.json({
//         answer:
//           "Utilization report ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        PERFORMANCE
//     ========================================= */
//     if (
//       intent ===
//       "PERFORMANCE"
//     ) {
//       const data =
//         await getTopPerformers(
//           {
//             month,
//             year
//           }
//         );

//       return res.json({
//         answer:
//           "Top performers ranked",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        PROJECTS
//     ========================================= */
//     if (
//       intent ===
//       "PROJECTS"
//     ) {
//       const data =
//         await getProjectInsights(
//           {
//             month,
//             year
//           }
//         );

//       return res.json({
//         answer:
//           "Project insights generated",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        EXECUTIVE
//     ========================================= */
//     if (
//       intent ===
//       "EXECUTIVE"
//     ) {
//       const data =
//         await getExecutiveSummary(
//           {
//             month,
//             year
//           }
//         );

//       return res.json({
//         answer:
//           "Executive summary ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        FORECAST
//     ========================================= */
//     if (
//       intent ===
//       "FORECAST"
//     ) {
//       const data =
//         await getForecastSummary(
//           {
//             months,
//             currentEmployees: 50
//           }
//         );

//       return res.json({
//         answer:
//           "Forecast generated",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        REVENUE FORECAST
//     ========================================= */
//     if (
//       intent ===
//       "REVENUE_FORECAST"
//     ) {
//       const data =
//         await forecastRevenue(
//           { months }
//         );

//       return res.json({
//         answer:
//           "Revenue forecast ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        BENCH FORECAST
//     ========================================= */
//     if (
//       intent ===
//       "BENCH_FORECAST"
//     ) {
//       const data =
//         await forecastBench({
//           months
//         });

//       return res.json({
//         answer:
//           "Bench forecast ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        UTIL FORECAST
//     ========================================= */
//     if (
//       intent ===
//       "UTIL_FORECAST"
//     ) {
//       const data =
//         await forecastUtilization(
//           {
//             months
//           }
//         );

//       return res.json({
//         answer:
//           "Utilization forecast ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        HIRING FORECAST
//     ========================================= */
//     if (
//       intent ===
//       "HIRING"
//     ) {
//       const data =
//         await forecastHiringDemand(
//           {
//             months,
//             currentEmployees: 50
//           }
//         );

//       return res.json({
//         answer:
//           "Hiring forecast ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        RESOURCE MATCHING
//     ========================================= */
//     if (
//       intent ===
//       "ALLOCATE"
//     ) {
//       const skills =
//         req.body.skills || [];

//       const data =
//         await recommendResources(
//           {
//             month,
//             year,
//             requiredSkills:
//               skills
//           }
//         );

//       return res.json({
//         answer:
//           "Best resources suggested",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        BENCH DEPLOYMENT
//     ========================================= */
//     if (
//       intent ===
//       "DEPLOY_BENCH"
//     ) {
//       const data =
//         await recommendBenchDeployment(
//           {
//             month,
//             year
//           }
//         );

//       return res.json({
//         answer:
//           "Bench deployment suggestions ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        LOAD BALANCING
//     ========================================= */
//     if (
//       intent ===
//       "LOAD_BALANCE"
//     ) {
//       const data =
//         await recommendLoadBalancing(
//           {
//             month,
//             year
//           }
//         );

//       return res.json({
//         answer:
//           "Load balancing recommendations ready",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        FULL RECOMMENDATION
//     ========================================= */
//     if (
//       intent ===
//       "RECOMMEND"
//     ) {
//       const skills =
//         req.body.skills || [];

//       const data =
//         await getRecommendationSummary(
//           {
//             month,
//             year,
//             requiredSkills:
//               skills
//           }
//         );

//       return res.json({
//         answer:
//           "Recommendations generated",
//         intent,
//         data
//       });
//     }

//     /* =========================================
//        FALLBACK LLM
//     ========================================= */
//     const llm =
//       await axios.post(
//         "http://127.0.0.1:11434/api/generate",
//         {
//           model: "llama3",
//           prompt: `
// You are an AI workforce copilot.

// Question:
// ${question}

// Give concise business answer.
//           `,
//           stream: false
//         }
//       );

//     return res.json({
//       answer:
//         llm.data.response,
//       intent: "LLM",
//       data: []
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       error:
//         error.message
//     });
//   }
// };
import { askRAG } from "../services/RAGService.js";

export const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    const result = await askRAG(question);

    res.json({
      success: true,
      answer: result.answer,
      data: result.contextUsed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Failed" });
  }
};