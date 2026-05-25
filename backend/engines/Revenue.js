/**
 * Revenue = rateSnapshot × hours
 * Cost = employee.hourlyCost × hours
 */
export function calculateRevenue(allocations = [], employee) {
  let revenue = 0;
  let cost = 0;

  allocations
    .filter(a => a.projectId?.status === "Active" && a.isBillable)
    .forEach(a => {
      revenue += a.rateSnapshot * a.allocatedHours;
      cost += employee.hourlyCost * a.allocatedHours;
    });

  return {
    revenue,
    cost,
    profit: revenue - cost,
  };
}