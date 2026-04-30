export function SkeletonRow() {
  return (
    <div className="animate-pulse flex gap-4 py-4">
      <div className="w-10 h-10 bg-slate-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
  );
}