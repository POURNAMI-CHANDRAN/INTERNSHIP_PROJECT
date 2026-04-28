import Employee from "../models/Employee.js";

export async function searchEmployees(filter = {}) {
  try {
    const query = {};

    if (filter.benchOnly) {
      query.utilization = { $lt: 30 };
    }

    if (filter.departmentId) {
      query.departmentId = filter.departmentId;
    }

    const employees = await Employee.find(query).lean();

    return employees.map(e => ({
      _id: e._id,
      name: e.name || "Unknown",
      email: e.email || "",
      role: e.role || "Employee",
      skills: e.skills || [],
      utilization: e.utilization ?? 0,
      hourlyCost: e.hourlyCost ?? 0,
      monthlySalary: e.monthlySalary ?? 0,
      location: e.location || "Unknown"
    }));

  } catch (err) {
    console.error("Employee fetch error:", err);
    return [];
  }
}