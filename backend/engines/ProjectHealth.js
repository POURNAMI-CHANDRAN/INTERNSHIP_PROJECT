/**
 * Detects capacity & financial risks in projects
 */
export function evaluateProjectHealth(projects, allocations) {
  return projects.map(project => {
    const projectAllocs = allocations.filter(
      a => a.projectId._id.toString() === project._id.toString()
    );

    const totalHours = projectAllocs.reduce(
      (s, a) => s + a.allocatedHours,
      0
    );

    const issues = [];

    if (project.status !== "Active" && totalHours > 0) {
      issues.push({
        issue: "Capacity locked in inactive project",
        severity: "HIGH",
        hours: totalHours,
      });
    }

    if (project.status === "Active" && totalHours < 40) {
      issues.push({
        issue: "Understaffed project",
        severity: "MEDIUM",
      });
    }

    return {
      project: project.name,
      status: project.status,
      totalHours,
      issues,
    };
  });
}