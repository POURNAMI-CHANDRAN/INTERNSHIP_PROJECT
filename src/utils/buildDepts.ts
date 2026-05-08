// interface Employee {
//   _id: string;
//   name: string;
//   departmentId?: { _id: string; name: string };
// }

// interface Department {
//   _id: string;
//   name: string;
// }

interface SidebarDepartment {
  _id: string;
  name: string;
  employees: Employee[];
}
export function buildDepartments(
  departments: Department[] = [],
  employees: Employee[] = []
): SidebarDepartment[] {
  return departments.map((dept) => ({
    _id: dept._id,
    name: dept.name,
    employees: employees.filter((emp) => {
      const empDeptId =
        typeof emp.departmentId === "object"
          ? emp.departmentId._id
          : emp.departmentId;

      return empDeptId === dept._id;
    }),
  }));
}

/* =========================================================
 TYPES
========================================================= */

interface Employee {
  _id: string;
  name: string;
  role?: string;

  departmentId?: {
    _id: string;
    name: string;
  };
}

interface Allocation {
  _id: string;
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
