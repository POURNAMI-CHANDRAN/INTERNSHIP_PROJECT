// import AIDocument from "../models/AIDocument.js";
// import { getEmbedding } from "./embeddingService.js";

// export async function askRAG(question) {
//   const vector = await getEmbedding(question);

//   const docs = await AIDocument.aggregate([
//     {
//       $vectorSearch: {
//         index: "ALLOCAI_MASTER",
//         path: "embedding",
//         queryVector: vector,
//         numCandidates: 100,
//         limit: 5
//       }
//     },
//     {
//       $project: {
//         _id: 1,
//         text: 1,
//         metadata: 1,
//         sourceType: 1,
//         score: { $meta: "vectorSearchScore" }
//       }
//     }
//   ]);

//   return {
//     answer: docs.map(d => d.text).join("\n\n"),
//     contextUsed: docs.map(d => ({
//       id: d._id,
//       score: Number(d.score.toFixed(3)),
//       metadata: d.metadata,
//       sourceType: d.sourceType
//     }))
//   };
// }

/* ================= RAG SERVICE (IMPROVED CLEAN OUTPUT) ================= */

import AIDocument from "../models/AIDocument.js";
import { getEmbedding } from "./embeddingService.js";

export async function askRAG(question) {
  const vector = await getEmbedding(question);

  const docs = await AIDocument.aggregate([
    {
      $vectorSearch: {
        index: "ALLOCAI_MASTER",
        path: "embedding",
        queryVector: vector,
        numCandidates: 100,
        limit: 5,
      },
    },
    {
      $project: {
        _id: 1,
        text: 1,
        metadata: 1,
        sourceType: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return {
    answer: docs.map(d => d.text).join("\n\n"),
    contextUsed: docs.map(d => ({
      id: d._id,
      score: Number(d.score.toFixed(3)),
      sourceType: d.sourceType,
      metadata: typeof d.metadata === "object"
        ? "structured_metadata"
        : d.metadata,
    })),
  };
}