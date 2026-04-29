export function parseEntities(question) {
  const q = question.toLowerCase();

  const cities = ["pune", "bengaluru", "chennai", "kolkata", "mysore", "kochi"];
  const skills = ["react", "java", "python", "sql", "mongodb"];

  return {
    location: cities.find(c => q.includes(c)) || null,
    skill: skills.find(s => q.includes(s)) || null,
    cheapest: q.includes("cheap") || q.includes("cheapest"),
    expensive: q.includes("expensive"),
  };
}