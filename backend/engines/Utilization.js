/**
 * Calculates effective utilization for an employee
 * Only Active projects count
 */
export function calculateUtilization(allocations = []) {
  const activeHours = allocations
    .filter(a => a.projectId?.status === "Active")
    .reduce((sum, a) => sum + a.allocatedHours, 0);

  const utilization = Math.round((activeHours / 160) * 100);

  let category = "OPTIMAL";
  if (utilization < 70) category = "UNDERUTILIZED";
  if (utilization > 100) category = "OVERLOADED";

  return {
    activeHours,
    utilization,
    category,
  };
}