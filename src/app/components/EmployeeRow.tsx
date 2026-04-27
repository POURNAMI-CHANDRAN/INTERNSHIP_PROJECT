import { MonthlyData } from "../../utils/HeatmapUtils";

type Employee = {
  _id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
};

type Props = {
  employee: Employee;
  monthlyData: MonthlyData[];
  onAssign: (
    employee: Employee,
    month: number,
    existingData?: MonthlyData
  ) => void;
};

export function EmployeeRow({
  employee,
  monthlyData,
  onAssign,
}: Props) {
  if (!employee) return null;

  const handleAssign = (
    month: number,
    data?: MonthlyData
  ) => {
    onAssign(employee, month, data);
  };

  return (
    <div
      className="grid border-b border-gray-100 hover:bg-blue-50/30 transition-colors group"
      style={{
        gridTemplateColumns:
          "280px repeat(12, 120px)",
      }}
    >
      {/* EMPLOYEE INFO */}
      <div className="sticky left-0 z-10 flex items-center gap-3 border-r border-gray-100 bg-white p-4 group-hover:bg-[#FDFDFE]">
        <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
          {employee.avatarUrl ? (
            <img
              src={employee.avatarUrl}
              alt={employee.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-gray-500">
              {employee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-gray-900">
            {employee.name}
          </div>

          <div className="truncate text-[11px] font-medium uppercase tracking-wider text-gray-500">
            {employee.role || "Resource"}
          </div>
        </div>
      </div>

      {/* MONTH CELLS */}
      {monthlyData.map((m) => (
        <div
          key={m.month}
          className="group/cell relative flex items-center justify-center border-r border-gray-50 p-2"
        >
          <div
            onClick={() => handleAssign(m.month, m)}
            className={`w-full h-[100px] rounded-lg p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:scale-[1.02]
            ${
              m.hasData
                ? `${m.color} ring-1 ring-inset ring-black/5`
                : "bg-gray-50/60 hover:bg-blue-50"
            }`}
          >
            {/* EMPTY CELL */}
            {!m.hasData ? (
              <div className="m-auto text-center opacity-0 transition-opacity group-hover/cell:opacity-100">
                <span className="text-[10px] font-bold text-blue-600">
                  + Assign
                </span>
              </div>
            ) : (
              <>
                {/* PROJECTS */}
                <div className="space-y-1.5 overflow-hidden">
                  {m.projects.slice(0, 2).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate pr-1 text-[10px] font-bold text-gray-800 opacity-90">
                          {p.projectName}
                        </span>

                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.isBillable
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>

                      <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
                        <div
                          className="h-full bg-black/20"
                          style={{
                            width: `${Math.min(
                              (p.hours / 160) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {m.projects.length > 2 && (
                    <div className="text-[9px] italic font-bold text-black/40">
                      + {m.projects.length - 2} more
                    </div>
                  )}
                </div>

                {/* FOOTER */}
                <div className="mt-auto flex items-baseline justify-between border-t border-black/5 pt-2">
                  <span className="text-[10px] font-black uppercase text-black/60">
                    {m.totalHours}h
                  </span>

                  <span
                    className={`text-[11px] font-bold ${
                      m.utilizationPct > 100
                        ? "text-red-700"
                        : "text-black/70"
                    }`}
                  >
                    {m.utilizationPct}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}