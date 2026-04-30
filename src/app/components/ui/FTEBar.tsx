export default function FTEBar({ used, max = 160 }: { used: number; max?: number }) {
  const pct = Math.min((used / max) * 100, 100);

  const color =
    used < max ? "bg-yellow-400" : used === max ? "bg-green-500" : "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>{used} hrs</span>
        <span>{max} hrs</span>
      </div>
      <div className="h-2 bg-gray-200 rounded">
        <div
          className={`h-2 rounded ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
``