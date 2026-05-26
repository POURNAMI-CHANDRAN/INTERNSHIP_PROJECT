import { useEffect, useState } from "react";
import api from "../../api/api";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const MONTHLY_CAPACITY = 160;

type Props = {
  open: boolean;
  employeeName: string;
  monthLabel: string;
  defaultHours?: number;
  workCategories?: any[];

  onClose: () => void;

  onSubmit: (data: {
    projectId: string;
    allocatedHours: number;
    isBillable: boolean;
    workCategoryId?: string;
  }) => Promise<void>;
};

export function AssignAllocationModal({
  open,
  employeeName,
  monthLabel,
  defaultHours = 40,
  workCategories = [],
  onClose,
  onSubmit,
}: Props) {
  const [projects, setProjects] = useState<any[]>([]);

  const [projectId, setProjectId] = useState("");

  const [workCategoryId, setWorkCategoryId] = useState("");

  const [hours, setHours] = useState<string>(
    String(Number(defaultHours) || 0)
  );

  const [fte, setFTE] = useState<string>(
    (
      (Number(defaultHours) || 0) /
      MONTHLY_CAPACITY
    ).toFixed(2)
  );

  const [isBillable, setIsBillable] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =========================================
     FETCH PROJECTS
  ========================================= */

  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      try {
        const res =
          await api.get("/projects");

        const projectList =
          Array.isArray(res.data)
            ? res.data
            : Array.isArray(
                res.data?.data
              )
            ? res.data.data
            : Array.isArray(
                res.data?.projects
              )
            ? res.data.projects
            : [];

        setProjects(projectList);

        setError(null);
      } catch (err) {
        console.error(
          "Project Fetch Failed:",
          err
        );

        setProjects([]);

        setError(
          "Unable to Load Projects."
        );
      }
    };

    fetchProjects();
  }, [open]);

  /* =========================================
     RESET MODAL
  ========================================= */

  useEffect(() => {
    if (open) {
      const initialHours =
        Number(defaultHours) || 0;

      setProjectId("");

      setWorkCategoryId("");

      setHours(String(initialHours));

      setFTE(
        (
          initialHours /
          MONTHLY_CAPACITY
        ).toFixed(2)
      );

      setIsBillable(true);

      setError(null);
    }
  }, [open, defaultHours]);

  /* =========================================
     HOURS → FTE
  ========================================= */

  const handleHoursChange = (
    value: string
  ) => {
    setHours(value);

    const parsed =
      Number(value) || 0;

    const calculatedFTE =
      parsed / MONTHLY_CAPACITY;

    setFTE(
      calculatedFTE.toFixed(2)
    );
  };

  /* =========================================
     FTE → HOURS
  ========================================= */

  const handleFTEChange = (
    value: string
  ) => {
    setFTE(value);

    const parsed =
      Number(value) || 0;

    const calculatedHours =
      Math.round(
        parsed * MONTHLY_CAPACITY
      );

    setHours(
      String(calculatedHours)
    );
  };

  if (!open) return null;

  /* =========================================
     SUBMIT
  ========================================= */

  const handleSubmit = async () => {
    setError(null);

    const parsedHours =
      Number(hours);

    if (!projectId) {
      setError(
        "Please Select a Project."
      );

      return;
    }

    if (
      parsedHours <= 0 ||
      parsedHours >
        MONTHLY_CAPACITY
    ) {
      setError(
        `Allocation must be between 1 and ${MONTHLY_CAPACITY} hours`
      );

      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        projectId,
        allocatedHours:
          parsedHours,
        isBillable,
        workCategoryId,
      });
    } catch (err: any) {
      setError(
        err?.response?.data
          ?.message ||
          "Failed to Save Allocation."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-[460px] rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* HEADER */}

        <div className="border-b px-6 py-4 bg-slate-50">

          <h3 className="text-xl font-bold text-center text-slate-900">
            Assign Allocation
          </h3>

          <p className="mt-1 text-[16px] text-center font-bold text-indigo-800">
            {employeeName} • {monthLabel} • 
          </p>
        </div>

        {/* BODY */}

        <div className="p-6 space-y-5">

          {/* ERROR */}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* PROJECT */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold uppercase tracking-wider text-sky-800">
              Project
            </label>

            <select
              value={projectId}
              onChange={(e) =>
                setProjectId(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              <option value="">
                Select Project...
              </option>

              {projects.map((p) => (
                <option
                  key={p._id}
                  value={p._id}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold uppercase tracking-wider text-sky-800">
              Category
            </label>

            <select
              value={workCategoryId}
              onChange={(e) =>
                setWorkCategoryId(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              <option value="">
                Select Category...
              </option>

              {workCategories.map((w) => (
                <option
                  key={w._id}
                  value={w._id}
                >
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* HOURS + FTE + BILLABLE */}

          <div className="space-y-2">

            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-800">
              <Clock size={12} />
              Allocation
            </label>

            <div className="grid grid-cols-3 gap-3">

              {/* HOURS */}

              <div className="space-y-1">

                <div className="text-center text-[11px] font-semibold uppercase text-slate-700">
                  Hours
                </div>

                <input
                  type="text"
                  value={hours}
                  onChange={(e) =>
                    handleHoursChange(
                      e.target.value
                    )
                  }
                  className="h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                />
              </div>

              {/* FTE */}

              <div className="space-y-1">

                <div className="text-center text-[11px] font-semibold uppercase text-slate-700">
                  FTE
                </div>

                <input
                  type="text"
                  value={fte}
                  onChange={(e) =>
                    handleFTEChange(
                      e.target.value
                    )
                  }
                  className="h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                />
              </div>

              {/* BILLABLE */}

              <div className="space-y-1">

                <div className="text-center text-[11px] font-semibold uppercase text-slate-700">
                  Billing
                </div>

                <label className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={isBillable}
                    onChange={(e) =>
                      setIsBillable(
                        e.target.checked
                      )
                    }
                  />

                  <span className="text-sm text-center font-medium">
                    Billable
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-1 text-center text-[11px] font-medium text-slate-500">
              1.00 FTE = 160 Hours / Month
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-center gap-3 border-t bg-slate-50 px-6 py-4">

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Assign
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cancel
          </button>

        </div>
      </div>
    </div>
  );
}