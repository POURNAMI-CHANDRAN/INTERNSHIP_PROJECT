import AIDocument from "../models/AIDocument.js";
import { getEmbedding } from "./embeddingService.js";

export async function searchTalent(question, entities) {
  const vector = await getEmbedding(question);

  const stage = {
    index: "ALLOCAI_MASTER",
    path: "embedding",
    queryVector: vector,
    numCandidates: 100,
    limit: 5,
    filter: { sourceType: "employee" },
  };

  if (entities.location) {
    stage.filter["metadata.location"] =
      entities.location[0].toUpperCase() + entities.location.slice(1);
  }

  const docs = await AIDocument.aggregate([
    { $vectorSearch: stage },
    { $project: { score: { $meta: "vectorSearchScore" }, metadata: 1 } },
  ]);

  let rows = docs.map(d => d.metadata);

  if (entities.cheapest) {
    rows.sort((a, b) => a.hourlyCost - b.hourlyCost);
  }

  return {
    answer: `Found ${rows.length} matching employees`,
    data: rows,
  };
}