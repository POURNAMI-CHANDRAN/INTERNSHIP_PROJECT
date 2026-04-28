import Employee from "../models/Employee.js";

// cosine similarity
function cosine(a, b) {
  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function vectorSearch(queryEmbedding, topK = 5) {
  const employees = await Employee.find().lean();

  const scored = employees.map(emp => {
    const score = emp.embedding
      ? cosine(queryEmbedding, emp.embedding)
      : 0;

    return { ...emp, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}