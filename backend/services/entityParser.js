export function parseEntities(question = "") {
  const q = question.toLowerCase();

  /* ================= LOCATIONS ================= */
  const cities = [
    "pune",
    "bengaluru",
    "bangalore",
    "chennai",
    "kolkata",
    "mysore",
    "kochi",
  ];

  /* ================= SKILLS ================= */
  const skills = [
    "react",
    "java",
    "python",
    "sql",
    "mongodb",
    "node",
    "angular",
  ];

  /* ================= BUSINESS KEYWORDS ================= */
  const keywords = {
    bench: q.includes("bench"),
    utilization: q.includes("utilization"),
    revenue: q.includes("revenue"),
    forecast: q.includes("forecast"),
    allocation: q.includes("allocation"),
    hiring: q.includes("hire") || q.includes("hiring"),
  };

  /* ================= MONTH DETECTION ================= */
  const months = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  let month = null;
  for (const m of Object.keys(months)) {
    if (q.includes(m)) {
      month = months[m];
      break;
    }
  }

  const yearMatch = q.match(/\b(20\d{2})\b/);

  return {
    location: cities.find((c) => q.includes(c)) || null,
    skill: skills.find((s) => q.includes(s)) || null,

    month,
    year: yearMatch ? Number(yearMatch[1]) : new Date().getFullYear(),

    flags: keywords,

    intentHints: {
      isBenchQuery: keywords.bench,
      isForecast: keywords.forecast,
      isRevenueQuery: keywords.revenue,
    },

    raw: question,
  };
}