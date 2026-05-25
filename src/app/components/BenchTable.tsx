interface BenchRow {
  employeeId: string;
  employeeId: string;
  name: string;
  benchHours: number;
  risk: "SAFE" | "MEDIUM" | "HIGH";
}

interface BenchTableProps {
  data: BenchRow[];
  onSelectEmployee: (employeeId: string) => void;
}

export function BenchTable({ data, onSelectEmployee }: BenchTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        No bench data available for this period.
      </div>
    );
  }

  const riskColor = (risk: BenchRow["risk"]) => {
    switch (risk) {
      case "HIGH":
        return "bg-red-100 text-red-700";
      case "MEDIUM":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-emerald-100 text-emerald-700";
    }
  };

  return (
    <table className="w-full text-sm border-separate border-spacing-y-1">
      <thead className="bg-slate-100">
        <tr>
          <th className="p-2 text-left">Employee</th>
          <th className="p-2 text-center">Bench Hours</th>
          <th className="p-2 text-center">Risk</th>
        </tr>
      </thead>

      <tbody>
        {data.map((e) => (
          <tr
            key={e.employeeId}
            tabIndex={0}
            role="button"
            aria-label={`Open ${e.name}'s details`}
            onClick={() => onSelectEmployee(e.employeeId)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                onSelectEmployee(e.employeeId);
              }
            }}
            className="
              cursor-pointer
              bg-white
              border
              hover:bg-slate-50
              focus:bg-slate-50
              focus:outline-none
              transition
            "
          >
            <td className="p-2 font-medium text-slate-900">
              {e.name}
              <span className="ml-1 text-xs text-slate-400">
                ({e.employeeId})
              </span>
            </td>

            <td className="p-2 text-center font-semibold">
              {e.benchHours}
            </td>

            <td className="p-2 text-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${riskColor(
                  e.risk
                )}`}
              >
                {e.risk}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}