/**
 * Bench = 160 - Active allocation hours
 */
export function calculateBench(allocations = []) {
  const activeHours = allocations
    .filter(a => a.projectId?.status === "Active")
    .reduce((sum, a) => sum + a.allocatedHours, 0);

  const benchHours = Math.max(0, 160 - activeHours);

  let risk = "SAFE";
  if (benchHours >= 120) risk = "HIGH";
  else if (benchHours >= 40) risk = "MEDIUM";

  return {
    benchHours,
    risk,
  };
}
