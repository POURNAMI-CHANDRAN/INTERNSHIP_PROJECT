// import { askRAG } from "../services/RAGService.js";

// export const askAI = async (req, res) => {
//   try {
//     const { question } = req.body;

//     // Validation
//     if (!question || question.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Question is Required"
//       });
//     }

//     const start = Date.now();

//     const result = await askRAG(question);

//     const duration = Date.now() - start;

//     return res.status(200).json({
//       success: true,
//       question,
//       answer: result.answer || "No Answer Found.",
//       data: result.contextUsed || [],
//       meta: {
//         responseTimeMs: duration,
//         timestamp: new Date()
//       }
//     });

//   } catch (error) {
//     console.error("AI Controller Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "AI Request Failed",
//       error: error.message
//     });
//   }
// };

import { askBrain } from "../services/brainService.js";

export const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    const result = await askBrain(question);

    res.json(result);
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({
      error: "AI Engine Failed"
    });
  }
};