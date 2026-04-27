import { useEffect, useState } from "react";
import api from "../../api/api";

type Props = {
  open: boolean;
  employeeName: string;
  monthLabel: string;
  defaultHours?: number;
  onClose: () => void;
  onSubmit: (data: {
    projectId: string;
    allocatedHours: number;
    isBillable: boolean;
  }) => Promise<void>;
};

export function AssignAllocationModal({
  open,
  employeeName,
  monthLabel,
  defaultHours = 40,
  onClose,
  onSubmit,
}: Props) {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");
  const [hours, setHours] = useState<number>(defaultHours);
  const [isBillable, setIsBillable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ✅ Fetch & NORMALIZE projects safely */
  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");

        // ✅ REAL‑WORLD SAFE NORMALIZATION
        const projectList =
          Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.projects)
            ? res.data.projects
            : [];

        setProjects(projectList);
        setError(null);
      } catch (err) {
        console.error("Project fetch failed:", err);
        setProjects([]);
        setError("Unable to load projects. Please try again.");
      }
    };

    fetchProjects();
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError(null);

    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    if (hours <= 0) {
      setError("Allocated hours must be greater than 0.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        projectId,
        allocatedHours: hours,
        isBillable,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to save allocation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">
          Assign Allocation
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {employeeName} · {monthLabel}
        </p>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {/* ✅ Project Select */}
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Select Project</option>

            {Array.isArray(projects) && projects.length > 0 ? (
              projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))
            ) : (
              <option disabled>No projects available</option>
            )}
          </select>

          {/* ✅ Hours */}
          <input
            type="number"
            min={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Allocated Hours"
          />

          {/* ✅ Billable */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
            />
            Billable Allocation
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}