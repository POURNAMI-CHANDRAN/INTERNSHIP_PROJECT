import { useEffect, useState } from "react";
import api from "../api/api";

interface HeatmapState {
  employees: any[];
  allocations: any[];
  departments: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>; 
}

function normalizeArray(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

export default function useResourceHeatmapData(year: number): HeatmapState {
  const [employees, setEmployees] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, allocRes, deptRes] = await Promise.all([
          api.get("/employees"),
          api.get("/allocations", { params: { year } }),
          api.get("/departments"),
        ]);

        const normalize = (res: any) =>
          Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];

        const employeesData = normalize(empRes.data);
        const allocationsData = normalize(allocRes.data).map((a: any) => ({
          ...a,
          employeeId:
            typeof a.employeeId === "object"
              ? a.employeeId._id
              : a.employeeId,
        }));
        const departmentsData = normalize(deptRes.data);

        setEmployees(employeesData);
        setAllocations(allocationsData);
        setDepartments(departmentsData);
      } catch (err) {
        console.error(err);
        setError("Failed to Load Data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, allocRes, deptRes] = await Promise.all([
        api.get("/employees"),
        api.get("/allocations", { params: { year } }),
        api.get("/departments"),
      ]);

      const normalize = (res: any) =>
        Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

      const employeesData = normalize(empRes.data);
      const allocationsData = normalize(allocRes.data).map((a: any) => ({
        ...a,
        employeeId:
          typeof a.employeeId === "object"
            ? a.employeeId._id
            : a.employeeId,
      }));
      const departmentsData = normalize(deptRes.data);

      setEmployees(employeesData);
      setAllocations(allocationsData);
      setDepartments(departmentsData);
    } catch (err) {
      console.error(err);
      setError("Failed to Load Data");
    } finally {
      setLoading(false);
    }
  };

  return { employees, allocations, departments, loading, error, refetch };
}