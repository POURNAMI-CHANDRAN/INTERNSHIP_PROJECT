/**
 * Predict next-month bench based on Active allocations
 */
export function forecastBench(allocationsByEmployee = []) {
  return allocationsByEmployee.map(e => {
    const activeHours = e.allocations
      .filter(a => a.projectId?.status === "Active")
      .reduce((s, a) => s + a.allocatedHours, 0);

    const predictedBench = Math.max(0, 160 - activeHours);

    let risk = "SAFE";
    if (predictedBench >= 120) risk = "HIGH";
    else if (predictedBench >= 40) risk = "MEDIUM";

    return {
      employeeId: e.employeeId,
      predictedBench,
      risk,
    };
  });
}