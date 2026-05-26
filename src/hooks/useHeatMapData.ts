import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

/* ================= TYPES ================= */

interface Employee {
  _id: string;
  name: string;
  roleId?: any;
}

interface Allocation {
  employeeId: string;
  allocatedHours: number;
  month: number;
  year: number;
  isBillable: boolean;
}

interface role {
  _id: string;
  name: string;
}

interface HeatmapState {
  employees: Employee[];
  allocations: Allocation[];
  roles: role[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/* ================= HELPERS ================= */

function normalizeArray(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function normalizeAllocations(data: any[]): Allocation[] {
  return data.map((a) => ({
    ...a,
    employeeId:
      typeof a.employeeId === "object"
        ? a.employeeId._id
        : String(a.employeeId),
    allocatedHours: Number(a.allocatedHours || 0),
    month: Number(a.month),
    year: Number(a.year),
  }));
}

/* ================= HOOK ================= */

export default function useResourceHeatmapData(
  year: number
): HeatmapState {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [roles, setroles] = useState<role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH FUNCTION ================= */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [empRes, allocRes, deptRes] = await Promise.all([
        api.get("/employees"),
        api.get("/allocations", { params: { year } }),
        api.get("/roles"),
      ]);

      const employeesData = normalizeArray(empRes.data);
      const allocationsRaw = normalizeArray(allocRes.data);
      const rolesData = normalizeArray(deptRes.data);

      setEmployees(employeesData);
      setAllocations(normalizeAllocations(allocationsRaw));
      setroles(rolesData);

    } catch (err: any) {
      console.error("Heatmap fetch error:", err);
      setError(err?.message || "Failed to load workload data");
    } finally {
      setLoading(false);
    }
  }, [year]);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    let isMounted = true;

    const safeFetch = async () => {
      await fetchAll();
    };

    if (isMounted) safeFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchAll]);

  /* ================= RETURN ================= */

  return {
    employees,
    allocations,
    roles,
    loading,
    error,
    refetch: fetchAll,
  };
}