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
        <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center shrink-0">
          {employee.avatarUrl ? (
            <img
              src={employee.avatarUrl}
              alt={employee.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-gray-900">
              {employee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-md font-bold tracking-tight text-sky-800">
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
          className="group/cell relative border-r border-gray-100 p-1 transition-all duration-300 hover:z-10"
        >
          <div
            onClick={() => handleAssign(m.month, m)}
            className={`min-h-[150px] w-full flex flex-col rounded-xl transition-all duration-300 cursor-pointer border
            ${m.hasData 
              ? "bg-white border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 hover:-translate-y-0.5" 
              : "bg-gray-50/50 border-dashed border-gray-200 hover:border-blue-300 hover:bg-white"
            }`}
          >
            {/* HEADER: NEUMORPHIC TOP BAR */}
            {m.hasData && (
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-b border-black/[0.03] ${m.color} bg-opacity-30`}>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-gray-900 tracking-tight leading-none">
                    {(m.totalHours / 160).toFixed(2)} <span className="text-[9px] font-medium opacity-60">FTE</span>
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                  m.utilizationPct > 100 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-white/80 text-gray-700 backdrop-blur-md"
                }`}>
                  {m.utilizationPct}%
                </div>
              </div>
            )}

            {/* BODY: PROJECT ROWS */}
            <div className="flex-1 px-1 py-1">
              {!m.hasData ? (
              <div className="flex h-full min-h-[140px] items-center justify-center opacity-0 transition-opacity group-hover/cell:opacity-100">
                <span className="text-[14px] font-bold text-blue-600">
                  + Assign
                </span>
              </div>
              ) : (
                <div className="space-y-1">
                  {m.projects.map((p, idx) => (
                    <div key={idx} className="px-2 py-2 rounded-lg hover:bg-sky-50/80 transition-colors group/row">
                      {/* Project Name & Status */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.isBillable ? 'bg-green-600' : 'bg-yellow-600'}`} />
                          <span className="truncate text-[10px] font-bold text-gray-700 tracking-tight">
                            {p.projectName}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 group-hover/row:text-gray-900 transition-colors">
                          {(p.hours / 160).toFixed(2)}
                        </span>
                      </div>

                      {/* Micro Progress Track */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-sky-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              p.isBillable ? "bg-gradient-to-r from-sky-500 to-sky-500" : "bg-sky-500"
                            }`}
                            style={{ width: `${Math.min((p.hours / 160) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-gray-500 tabular-nums">
                          {p.hours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER: TOTALS */}
            {m.hasData && (
              <div className="mt-auto px-3 py-2 bg-gray-50/50 rounded-b-xl border-t border-gray-100 flex justify-between items-center">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                <span className="text-[10px] font-black text-gray-900 tabular-nums">{m.totalHours} hrs</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}