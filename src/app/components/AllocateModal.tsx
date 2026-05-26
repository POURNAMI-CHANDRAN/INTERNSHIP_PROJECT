import { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  User,
  Briefcase,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const MONTHLY_CAPACITY = 160;

type Mode = "create" | "edit" | "move";

interface AllocateModalProps {
  mode: Mode;
  allocation?: any;
  employees?: any[];
  projects: any[];
  workCategories?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AllocateModal({
  mode,
  allocation,
  employees = [],
  projects,
  workCategories = [],
  onClose,
  onSuccess,
}: AllocateModalProps) {
  /* =====================================================
     STATE
  ===================================================== */

  const [employeeId, setEmployeeId] = useState(
    allocation?.employeeId?._id ||
      allocation?.employeeId ||
      ""
  );

  const [projectId, setProjectId] = useState(
    allocation?.projectId?._id ||
      allocation?.projectId ||
      ""
  );

  const [workCategoryId, setWorkCategoryId] =
    useState(
      allocation?.workCategoryId?._id ||
        allocation?.workCategoryId ||
        ""
    );

  const [month, setMonth] = useState(
    allocation?.month ||
      new Date().getMonth() + 1
  );

  const [year, setYear] = useState(
    allocation?.year ||
      new Date().getFullYear()
  );

  const [isBillable, setIsBillable] =
    useState(
      allocation?.isBillable ?? true
    );

  const [allocatedHours, setAllocatedHours] =
    useState("");

  const [allocatedFTE, setAllocatedFTE] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     INITIAL VALUES
  ===================================================== */

  useEffect(() => {
    if (
      allocation?.allocatedHours &&
      mode === "edit"
    ) {
      const hours = Number(
        allocation.allocatedHours
      );

      setAllocatedHours(
        String(hours)
      );

      setAllocatedFTE(
        (hours / MONTHLY_CAPACITY).toFixed(
          2
        )
      );
    }
  }, [allocation, mode]);

  /* =====================================================
     HOURS CHANGE
  ===================================================== */

  const handleHoursChange = (
    value: string
  ) => {
    setAllocatedHours(value);

    const hours =
      Number(value) || 0;

    const calculatedFTE =
      hours / MONTHLY_CAPACITY;

    setAllocatedFTE(
      calculatedFTE.toFixed(2)
    );
  };

  /* =====================================================
     FTE CHANGE
  ===================================================== */

  const handleFTEChange = (
    value: string
  ) => {
    setAllocatedFTE(value);

    const fte =
      Number(value) || 0;

    const calculatedHours =
      Math.round(
        fte * MONTHLY_CAPACITY
      );

    setAllocatedHours(
      String(calculatedHours)
    );
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const submit = async () => {
    try {
      setLoading(true);

      setError("");

      const hours = Number(
        allocatedHours
      );

      if (
        mode !== "move" &&
        (hours <= 0 ||
          hours >
            MONTHLY_CAPACITY)
      ) {
        throw new Error(
          `Allocation must be between 1 and ${MONTHLY_CAPACITY} hours`
        );
      }

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "token"
          )}`,
        },
      };

      /* =========================================
         CREATE
      ========================================= */

      if (mode === "create") {
        if (
          !employeeId ||
          !projectId ||
          !workCategoryId
        ) {
          throw new Error(
            "Please fill all required fields"
          );
        }

        const employee =
          employees.find(
            (e) =>
              e._id === employeeId
          );

        const existingHours =
          employee?.allocations?.reduce(
            (
              sum: number,
              a: any
            ) =>
              sum +
              Number(
                a?.allocatedHours ||
                  0
              ),
            0
          ) || 0;

        const totalHours =
          existingHours + hours;

        if (
          totalHours >
          MONTHLY_CAPACITY
        ) {
          throw new Error(
            `Employee exceeds monthly capacity (${totalHours}/${MONTHLY_CAPACITY}h)`
          );
        }

        await axios.post(
          `${API}/api/allocations`,
          {
            employeeId,
            projectId,
            workCategoryId,
            allocatedHours: hours,
            month,
            year,
            isBillable,
          },
          config
        );
      }

      /* =========================================
         EDIT
      ========================================= */

      else if (mode === "edit") {
        await axios.put(
          `${API}/api/allocations/${allocation._id}`,
          {
            allocatedHours: hours,
            isBillable,
          },
          config
        );
      }

      /* =========================================
         MOVE
      ========================================= */

      else if (mode === "move") {
        if (!projectId) {
          throw new Error(
            "Please Select a Target Project"
          );
        }

        await axios.put(
          `${API}/api/allocations/${allocation._id}/move`,
          {
            newProjectId:
              projectId,
          },
          config
        );
      }

      onSuccess();

      onClose();
    } catch (err: any) {
      setError(
        err.response?.data
          ?.message ||
          err.message ||
          "Operation Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* BACKDROP */}

      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* MODAL */}

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* HEADER */}

        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">

          <div className="flex items-center gap-3">

            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
              {mode === "move" ? (
                <ArrowRightLeft size={20} />
              ) : (
                <Briefcase size={20} />
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {mode === "create"
                ? "New Allocation"
                : mode === "edit"
                ? "Edit Details"
                : "Move Resource"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}

        <div className="p-6 space-y-5">

          {/* ERROR */}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid gap-4">

            {/* EMPLOYEE */}

            {mode === "create" && (
              <div className="space-y-1.5">

                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <User size={12} />
                  Resource
                </label>

                <select
                  value={employeeId}
                  onChange={(e) =>
                    setEmployeeId(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                >
                  <option value="">
                    Select Employee...
                  </option>

                  {employees.map(
                    (e) => (
                      <option
                        key={e._id}
                        value={e._id}
                      >
                        {e.employeeId} •{" "}
                        {e.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* PROJECT */}

            {(mode === "create" ||
              mode === "move") && (
              <div className="space-y-1.5">

                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <Briefcase size={12} />
                  Target Project
                </label>

                <select
                  value={projectId}
                  onChange={(e) =>
                    setProjectId(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
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
            )}

            {/* WORK CATEGORY */}

            {mode === "create" && (
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
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                >
                  <option value="">
                    Select Category...
                  </option>

                  {workCategories.map(
                    (w) => (
                      <option
                        key={w._id}
                        value={w._id}
                      >
                        {w.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* HOURS + FTE */}
            {(mode === "create" || mode === "edit") && (

              <div className="space-y-1.5">

                {/* LABEL */}

                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <Clock size={12} />
                  Allocation
                </label>

                {/* 3 COLUMN LAYOUT */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">

                  {/* =========================
                      HOURS
                  ========================= */}

                  <div className="space-y-1">

                    <div className="text-[11px] font-semibold uppercase text-center tracking-wide text-slate-800">
                      Hours / Month
                    </div>

                    <div className="relative">

                      <input
                        type="text"
                        inputMode="numeric"
                        min={0}
                        max={MONTHLY_CAPACITY}
                        step="1"
                        placeholder="HOURS"
                        value={allocatedHours}
                        onChange={(e) =>
                          handleHoursChange(
                            e.target.value
                          )
                        }
                        className="w-full h-[42px] bg-slate-50 border border-slate-200 px-3 pr-10 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase pointer-events-none">
                        hrs
                      </span>

                    </div>
                  </div>

                  {/* =========================
                      FTE
                  ========================= */}

                  <div className="space-y-1">

                    <div className="text-[11px] font-semibold text-center uppercase tracking-wide text-slate-800">
                      FTE
                    </div>

                    <div className="relative">

                      <input
                        type="text"
                        inputMode="numeric"
                        min={0}
                        max={1}
                        step="0.01"
                        placeholder="FTE"
                        value={allocatedFTE}
                        onChange={(e) =>
                          handleFTEChange(
                            e.target.value
                          )
                        }
                        className="w-full h-[42px] bg-slate-50 border border-slate-200 px-3 pr-10 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase pointer-events-none">
                        fte
                      </span>

                    </div>
                  </div>

                  {/* =========================
                      BILLABLE
                  ========================= */}

                  <div className="space-y-1">

                    <div className="text-[11px] font-semibold text-center uppercase tracking-wide text-slate-800">
                      Billing
                    </div>

                    <label className="w-full h-[42px] flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg px-4 hover:border-sky-300 hover:bg-sky-50/40 transition-all">

                      <input
                        type="checkbox"
                        checked={isBillable}
                        onChange={(e) =>
                          setIsBillable(
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500/20"
                      />

                      <span className="text-sm text-center font-semibold text-slate-700">
                        Billable
                      </span>

                    </label>
                  </div>
                </div>

                {/* INFO */}

                <div className="flex items-center justify-center gap-2 pt-1">

                  <div className="w-1.5 h-1.5 rounded-full bg-sky-800" />

                  <span className="text-[11px] font-medium text-slate-800">
                    1.00 FTE = 160 Hours / Month
                  </span>

                </div>
              </div>
            )}

            {/* PERIOD */}

            {mode === "create" && (
              <div className="space-y-1.5">

                <label className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                  <Calendar size={12} />
                  Allocation Period
                </label>

                <div className="grid grid-cols-2 gap-2">

                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) =>
                      setMonth(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    placeholder="Month"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm"
                  />

                  <input
                    type="number"
                    value={year}
                    onChange={(e) =>
                      setYear(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    placeholder="Year"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-3">

          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md shadow-sky-200 transition-all active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}

            {mode === "create"
              ? "Confirm Allocation"
              : mode === "edit"
              ? "Update Records"
              : "Move Resource"}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}