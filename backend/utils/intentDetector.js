export function detectIntent(q = "") {
  const text = q.toLowerCase();

  if (text.includes("bench")) return "BENCH_ANALYSIS";
  if (text.includes("forecast") || text.includes("revenue")) return "REVENUE_FORECAST";
  if (text.includes("dashboard")) return "DASHBOARD";
  if (text.includes("developer") || text.includes("react") || text.includes("hire"))
    return "RESOURCE_RECOMMENDATION";

  return "GENERAL_RAG";
}