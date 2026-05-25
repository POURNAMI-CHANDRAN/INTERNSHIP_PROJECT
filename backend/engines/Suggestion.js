/**
 * Rule-based intelligent recommendations
 */
export function suggestMoves({ employees, projects }) {
  const suggestions = [];

  employees.forEach(emp => {
    if (emp.bench.benchHours < 40) return;

    projects.forEach(project => {
      if (project.status !== "Active") return;

      const skillMatch = emp.skills.some(s =>
        project.requiredSkills?.includes(s)
      );

      if (!skillMatch) return;

      suggestions.push({
        employee: emp.name,
        project: project.name,
        suggestedHours: Math.min(40, emp.bench.benchHours),
        reason: "Bench availability + skill match",
        confidence: 0.85,
      });
    });
  });

  return suggestions;
}