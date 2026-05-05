// export function detectIntent(q = "") {
//   const text = q.toLowerCase();

//   if (text.includes("bench")) return "BENCH_ANALYSIS";
//   if (text.includes("forecast") || text.includes("revenue")) return "REVENUE_FORECAST";
//   if (text.includes("dashboard")) return "DASHBOARD";
//   if (text.includes("developer") || text.includes("react") || text.includes("hire"))
//     return "RESOURCE_RECOMMENDATION";

//   return "GENERAL_RAG";
// }

export function detectIntent(q = "") {
  const text = q.toLowerCase();

  /* ================= LOCATIONS ================= */
  const hasLocation =
    /pune|bengaluru|bangalore|chennai|kolkata|mysore|kochi/.test(text);

  /* ================= EMPLOYEE WORDS ================= */
  const hasEmployeeWord =
    /employee|employees|staff|people|resource|resources/.test(text);

  /* ================= PRIORITY RULES ================= */

  // 1️⃣ Bench queries (highest priority)
  if (text.includes("bench")) {
    return hasLocation ? "BENCH_LOCATION_SEARCH" : "BENCH_ANALYSIS";
  }

  // 2️⃣ Employees by location (THIS FIXES YOUR ISSUE)
  if (hasEmployeeWord && hasLocation) {
    return "EMPLOYEE_LOCATION_SEARCH";
  }

  // 3️⃣ Generic employee listing
  if (hasEmployeeWord) {
    return "EMPLOYEE_LIST";
  }

  // 4️⃣ Revenue / forecast
  if (text.includes("forecast") || text.includes("revenue")) {
    return "REVENUE_FORECAST";
  }

  // 5️⃣ Dashboard
  if (text.includes("dashboard")) {
    return "DASHBOARD";
  }

  // 6️⃣ Hiring / skills
  if (text.includes("developer") || text.includes("react") || text.includes("hire")) {
    return "RESOURCE_RECOMMENDATION";
  }

  // 7️⃣ Fallback to RAG
  return "GENERAL_RAG";
}