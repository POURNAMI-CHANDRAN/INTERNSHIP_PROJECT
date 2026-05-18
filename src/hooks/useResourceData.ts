import { useCallback, useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

type ApiResponse<T> = T[] | { data: T[] };

export function useResourceData(month: number, year: number) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setroles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [workCategories, setWorkCategories] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const token = localStorage.getItem("token");

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
  };

  const normalize = <T,>(res: ApiResponse<T>): T[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const safeFetch = async <T,>(url: string): Promise<T[]> => {
    const token = localStorage.getItem("token"); // ✅ always fresh

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ ALWAYS send
          "Content-Type": "application/json",
        },
        signal: abortRef.current?.signal,
      });

      console.log("➡️ REQUEST:", url);
      console.log("➡️ TOKEN:", token);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ API ERROR:", res.status, text);
        return [];
      }

      const data = await res.json();
      console.log("✅ RESPONSE:", data);

      return normalize<T>(data);
    } catch (err) {
      console.error("❌ FETCH FAILED:", url, err);
      return [];
    }
  };

  const fetchAll = useCallback(async () => {
    if (!token) {
      setError("Authentication Required");
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const [
        empData,
        roleData,
        projData,
        wcData,
        revData,
      ] = await Promise.all([
        safeFetch<any>(`${API}/api/employees?month=${month}&year=${year}`),
        safeFetch<any>(`${API}/api/roles`),
        safeFetch<any>(`${API}/api/projects`),
        safeFetch<any>(`${API}/api/workcategories`),
        month && year
          ? safeFetch<any>(`${API}/api/billing?month=${month}&year=${year}`)
          : Promise.resolve([]),
      ]);

      setEmployees(empData);
      setroles(roleData);
      setProjects(projData);
      setWorkCategories(wcData);
      setRevenues(revData);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Resource Fetch Failed:", err);
        setError("Failed to Load Resource Data");
      }
    } finally {
      setLoading(false);
    }
  }, [API, month, year, token]);

  const refetchEmployees = useCallback(async () => {
    if (!token) return;

    try {
      const empData = await safeFetch<any>(
        `${API}/api/employees?month=${month}&year=${year}`
      );
      setEmployees(empData);
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        console.error("Failed to Refetch Employees", err);
      }
    }
  }, [API, month, year, token]);

  useEffect(() => {
    fetchAll();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchAll]);

  return {
    employees,
    roles,
    projects,
    workCategories,
    revenues,
    loading,
    error,
    refetchEmployees,
    refetchAll: fetchAll,
  };
}