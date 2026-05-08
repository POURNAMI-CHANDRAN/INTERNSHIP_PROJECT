// import { useEffect, useState } from "react";
// import api from "../api/api";

// interface HeatmapState {
//   employees: any[];
//   allocations: any[];
//   departments: any[];
//   loading: boolean;
//   error: string | null;
//   refetch: () => Promise<void>; 
// }

// function normalizeArray(res: any): any[] {
//   if (Array.isArray(res)) return res;
//   if (Array.isArray(res?.data)) return res.data;
//   if (Array.isArray(res?.data?.data)) return res.data.data;
//   return [];
// }

// export default function useResourceHeatmapData(year: number): HeatmapState {
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [allocations, setAllocations] = useState<any[]>([]);
//   const [departments, setDepartments] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [empRes, allocRes, deptRes] = await Promise.all([
//           api.get("/employees"),
//           api.get("/allocations", { params: { year } }),
//           api.get("/departments"),
//         ]);

//         const normalize = (res: any) =>
//           Array.isArray(res)
//             ? res
//             : Array.isArray(res?.data)
//             ? res.data
//             : Array.isArray(res?.data?.data)
//             ? res.data.data
//             : [];

//         const employeesData = normalize(empRes.data);
//         const allocationsData = normalize(allocRes.data).map((a: any) => ({
//           ...a,
//           employeeId:
//             typeof a.employeeId === "object"
//               ? a.employeeId._id
//               : a.employeeId,
//         }));
//         const departmentsData = normalize(deptRes.data);

//         setEmployees(employeesData);
//         setAllocations(allocationsData);
//         setDepartments(departmentsData);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to Load Data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [year]);

//   const refetch = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [empRes, allocRes, deptRes] = await Promise.all([
//         api.get("/employees"),
//         api.get("/allocations", { params: { year } }),
//         api.get("/departments"),
//       ]);

//       const normalize = (res: any) =>
//         Array.isArray(res)
//           ? res
//           : Array.isArray(res?.data)
//           ? res.data
//           : Array.isArray(res?.data?.data)
//           ? res.data.data
//           : [];

//       const employeesData = normalize(empRes.data);
//       const allocationsData = normalize(allocRes.data).map((a: any) => ({
//         ...a,
//         employeeId:
//           typeof a.employeeId === "object"
//             ? a.employeeId._id
//             : a.employeeId,
//       }));
//       const departmentsData = normalize(deptRes.data);

//       setEmployees(employeesData);
//       setAllocations(allocationsData);
//       setDepartments(departmentsData);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to Load Data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { employees, allocations, departments, loading, error, refetch };
// }

import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

/* ================= TYPES ================= */

interface Employee {
  _id: string;
  name: string;
  departmentId?: any;
}

interface Allocation {
  employeeId: string;
  allocatedHours: number;
  month: number;
  year: number;
}

interface Department {
  _id: string;
  name: string;
}

interface HeatmapState {
  employees: Employee[];
  allocations: Allocation[];
  departments: Department[];
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
  const [departments, setDepartments] = useState<Department[]>([]);
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
        api.get("/departments"),
      ]);

      const employeesData = normalizeArray(empRes.data);
      const allocationsRaw = normalizeArray(allocRes.data);
      const departmentsData = normalizeArray(deptRes.data);

      setEmployees(employeesData);
      setAllocations(normalizeAllocations(allocationsRaw));
      setDepartments(departmentsData);

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
    departments,
    loading,
    error,
    refetch: fetchAll,
  };
}