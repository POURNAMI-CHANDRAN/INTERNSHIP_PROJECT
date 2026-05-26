import { useMemo, useState, useCallback, useEffect } from "react";
import useResourceHeatmapData from "../../hooks/useHeatMapData";
import { mapAllocationsToMonths } from "../../utils/HeatmapUtils";
import { EmployeeRow } from "../components/EmployeeRow";
import { AssignAllocationModal } from "../components/AssignModal";
import api from "../../api/api";

const MONTHS = [
  { month: 1, label: "Jan" },
  { month: 2, label: "Feb" },
  { month: 3, label: "Mar" },
  { month: 4, label: "Apr" },
  { month: 5, label: "May" },
  { month: 6, label: "Jun" },
  { month: 7, label: "Jul" },
  { month: 8, label: "Aug" },
  { month: 9, label: "Sep" },
  { month: 10, label: "Oct" },
  { month: 11, label: "Nov" },
  { month: 12, label: "Dec" },
];

type AssignContext = {
  employee: any;
  month: number;
  existingData?: any;
};

export default function HeatmapScheduler() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [saving, setSaving] = useState(false);

  const [assignContext, setAssignContext] = useState<AssignContext | null>(null);
  const [workCategories, setWorkCategories] = useState<any[]>([]);

  const {
    employees,
    allocations,
    loading,
    error,
    refetch,
  } = useResourceHeatmapData(year);

  /* Map employees → monthly heatmap rows */
  const employeeRows = useMemo(() => {
    if (!employees?.length) return [];

    return employees.map((employee: any) => {

      const employeeAllocations = (allocations || []).filter(
        (a: any) =>
          String(a.employeeId?._id || a.employeeId) ===
          String(employee._id)
      );

      let monthlyData = [];

      try {
        monthlyData = mapAllocationsToMonths(
          employeeAllocations || [],
          MONTHS,
          year
        );
      } catch (err) {
        console.error("MAP ERROR:", err);

        // FALLBACK EMPTY MONTHS
        monthlyData = MONTHS.map((m) => ({
          month: m.month,
          hasData: false,
          totalHours: 0,
          utilizationPct: 0,
          color: "bg-gray-100",
          projects: [],
        }));
      }

      return {
        employee,
        monthlyData,
      };
    });
  }, [employees, allocations, year]);


  /* Called from EmployeeRow */
  const handleAssign = useCallback(
    (employee: any, month: number, existingData?: any) => {
      setAssignContext({ employee, month, existingData });
    },
    []
  );

const handleSubmitAssignment = async (data: {
  projectId: string;
  allocatedHours: number;
  isBillable: boolean;
  workCategoryId?: string;
}) => {
  if (!assignContext) return;

  try {
    setSaving(true);

    await api.post("/allocations", {
      employeeId: assignContext.employee._id,
      month: assignContext.month,
      year,
      projectId: data.projectId,
      allocatedHours: data.allocatedHours,
      isBillable: data.isBillable,
      workCategoryId: data.workCategoryId || null, 
    });

    await refetch();
    setAssignContext(null);
  } finally {
    setSaving(false);
  }
};

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await api.get("/workcategories");

      const categories =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setWorkCategories(categories);
    } catch (err) {
      console.error(
        "Failed to Fetch Work Categories",
        err
      );
    }
  };

  fetchCategories();
}, []);

  /* LOADING */
  if (loading && !employees.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="font-medium text-gray-500">
            Syncing Resource Grid...
          </p>
        </div>
      </div>
    );
  }

  /* ERROR */
  if (error) {
    return (
      <div className="mx-auto mt-20 max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-bold text-red-600">Database Error</p>
        <p className="mt-2 text-sm text-red-500">{error}</p>
        <button
          onClick={refetch}
          className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#F8F9FB]">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold">
            Resource<span className="text-blue-600"> Planner</span>
          </h1>
          <p className="text-sm text-gray-500">
            Managing Allocations for {year}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {saving && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase">
                Saving
              </span>
            </div>
          )}

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y} Fiscal Year
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* GRID */}
      <div className="flex-1 overflow-auto">
        <div className="relative min-w-full">
          <div
            className="sticky top-0 z-20 grid border-b bg-sky-50"
            style={{ gridTemplateColumns: "280px repeat(12, 120px)" }}
          >
            <div className="sticky top-0 z-30 border-r bg-sky-50 p-4 text-center text-md font-bold uppercase">
              Resource Name
            </div>

            {MONTHS.map((m) => (
              <div key={m.month} className="border-r p-4 text-center">
                <div className="text-sm font-bold">{m.label}</div>
                <div className="text-[10px] text-gray-400">HOURS</div>
              </div>
            ))}
          </div>

          <div className="bg-white">
            {employeeRows.map((row: any) => (
              <EmployeeRow
                key={row.employee._id}
                employee={row.employee}
                monthlyData={row.monthlyData}
                onAssign={handleAssign}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ASSIGN MODAL */}
      <AssignAllocationModal
        open={!!assignContext}
        employeeName={assignContext?.employee.name || ""}
        monthLabel={
          MONTHS.find((m) => m.month === assignContext?.month)?.label || ""
        }
        defaultHours={
          assignContext?.existingData?.totalHours || 0
        }

        workCategories={workCategories}

        onClose={() => setAssignContext(null)}
        onSubmit={handleSubmitAssignment}
      />
    </div>
  );
}
