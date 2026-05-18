// interface Employee {
//   _id: string;
//   name: string;
//   roleId?: { _id: string; name: string };
// }

// interface role {
//   _id: string;
//   name: string;
// }

interface Sidebarrole {
  _id: string;
  name: string;
  employees: Employee[];
}
export function buildroles(
  roles: role[] = [],
  employees: Employee[] = []
): Sidebarrole[] {
  return roles.map((dept) => ({
    _id: dept._id,
    name: dept.name,
    employees: employees.filter((emp) => {
      const empDeptId =
        typeof emp.roleId === "object"
          ? emp.roleId._id
          : emp.roleId;

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

  roleId?: {
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
