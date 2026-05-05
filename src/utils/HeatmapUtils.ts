// ================= TYPES =================
export type Allocation = {
  month: number;
  year: number;
  allocatedHours: number;
  isBillable: boolean;
  employeeId: string;
  projectId?: {
    _id: string;
    name: string;
  };
};

export type Month = {
  month: number;
  label: string;
};

export type ProjectData = {
  projectName: string;
  hours: number;
  isBillable: boolean;
};

export type MonthlyData = {
  month: number;
  totalHours: number;
  billableHours: number;
  utilizationPct: number;
  hasData: boolean;
  color: string;
  projects: ProjectData[];
};

// ================= CONSTANT =================
const CAPACITY = 160;

// ================= COLOR LOGIC =================
export function getHeatmapColor(utilization: number): string {
  if (utilization === 0) return "bg-rose-50 text-rose-400";
  if (utilization <= 60) return "bg-yellow-100 text-yellow-800";
  if (utilization <= 100) return "bg-green-100 text-green-800";
  return "bg-red-200 text-red-900";
}

// ================= MAIN MAPPER =================
export function mapAllocationsToMonths(
  allocations: Allocation[],
  months: Month[],
  year: number
): MonthlyData[] {
  return months.map(({ month }) => {
    const monthData = allocations.filter(
      (a) =>
        Number(a.month) === Number(month) &&
        Number(a.year) === Number(year)
    );

    const totalHours = monthData.reduce(
      (sum, a) => sum + Number(a.allocatedHours || 0),
      0
    );

    const billableHours = monthData
      .filter((a) => a.isBillable)
      .reduce((sum, a) => sum + Number(a.allocatedHours || 0), 0);

    const utilizationPct =
      CAPACITY > 0 ? Math.round((totalHours / CAPACITY) * 100) : 0;

    const projects: ProjectData[] = monthData.map((a) => ({
      projectName: a.projectId?.name || "Unknown",
      hours: Number(a.allocatedHours || 0),
      isBillable: a.isBillable,
    }));

    return {
      month,
      totalHours,
      billableHours,
      utilizationPct,
      hasData: totalHours > 0,
      color: getHeatmapColor(utilizationPct),
      projects,
    };
  });
}