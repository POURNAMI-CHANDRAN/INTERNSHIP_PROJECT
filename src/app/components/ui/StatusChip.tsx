export function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Optimal: "bg-green-100 text-green-700",
    Underbilled: "bg-yellow-100 text-yellow-700",
    Overbilled: "bg-red-100 text-red-700",
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    ON_HOLD: "bg-orange-100 text-orange-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}