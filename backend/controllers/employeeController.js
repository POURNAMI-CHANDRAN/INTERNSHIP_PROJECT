import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { getNextEmployeeCode } from "../utils/Next.js";
import Allocation from "../models/Allocation.js";
import Project from "../models/Project.js";
import WorkCategory from "../models/WorkCategory.js";
import Skill from "../models/Skill.js";

/* ================= CREATE ================= */
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      departmentId,
      primaryWorkCategoryId,
      skills,
      hourlyCost,
      status,
      joiningDate,
      location,
    } = req.body;

    const employeeCode = await getNextEmployeeCode();

    const employee = await Employee.create({
      employeeCode,
      name,
      email,
      departmentId,
      primaryWorkCategoryId,
      skills: skills || [],
      hourlyCost,
      status,
      joiningDate,
      location,
    });

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= READ (ALL) ================= */
export const getEmployees = async (req, res) => {
  try {
    const { month, year } = req.query;

    const employees = await Employee.find()
      .populate("primaryWorkCategoryId")
      .populate("skills")
      .populate("departmentId", "name");

    const employeeIds = employees.map(e => e._id);

    // ✅ pull allocations for requested month/year
    const allocations = await Allocation.find({
      employeeId: { $in: employeeIds },
      ...(month && year && {
        month: Number(month),
        year: Number(year),
      }),
    }).populate("projectId", "name");

    // ✅ group allocations by employee
    const allocationMap = allocations.reduce((acc, a) => {
      const key = a.employeeId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {});

    // ✅ attach allocations to employees
    const enrichedEmployees = employees.map(e => ({
      ...e.toObject(),
      allocations: allocationMap[e._id.toString()] || [],
    }));

    res.json(enrichedEmployees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------------------------------------------------------
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("primaryWorkCategoryId")
      .populate("skills");

    const employeeIds = employees.map(e => e._id);

    const allocations = await Allocation.find({
      employeeId: { $in: employeeIds },
      month: Number(req.query.month),
      year: Number(req.query.year),
    }).populate("projectId", "name");

    const allocationMap = allocations.reduce((map, a) => {
      const key = a.employeeId.toString();
      if (!map[key]) map[key] = [];
      map[key].push(a);
      return map;
    }, {});

    const result = employees.map(e => ({
      ...e.toObject(),
      allocations: allocationMap[e._id.toString()] || []
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= READ (ONE) ================= */
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("primaryWorkCategoryId", "name")
      .populate("skills");

    if (!employee) {
      return res.status(404).json({ message: "Employee NOT Found" });
    }

    // ✅ Fetch allocations SEPARATELY (this is the key fix)
    const allocations = await Allocation.find({
      employeeId: employee._id,
    })
      .populate("projectId", "name status startDate endDate")
      .populate("workCategoryId", "name");

    // ✅ Supporting data for drawer
    const projects = await Project.find({ status: "Active" });
    const workCategories = await WorkCategory.find({ status: "Active" });

    res.json({
      success: true,
      data: {
        ...employee.toObject(),
        allocations,
        projects,
        workCategories,
      },
    });

  } catch (err) {
    console.error("❌ getEmployeeById Failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ================= UPDATE ================= */
export const updateEmployee = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,   // ✅ FIXED
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Employee NOT Found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id); 

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee NOT Found"
      });
    }

    // ✅ Check remaining employees
    const remaining = await Employee.countDocuments();

    if (remaining === 0) {
      await Counter.findByIdAndUpdate(
        { _id: "employee" },
        { seq: 0 },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: "Employee Deleted Successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------------
export const getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.userId,
    })
      .populate("departmentId")
      .populate("primaryWorkCategoryId")
      .populate("skills");

    // USER HAS NO EMPLOYEE PROFILE
    if (!employee) {
      return res.json({
        data: {
          name: req.user.name,
          role: req.user.role,
          skills: [],
          allocations: [],
        },
      });
    }

    const allocations = await Allocation.find({
      employeeId: employee._id,
    }).populate("projectId");

    res.json({
      data: {
        ...employee.toObject(),
        allocations,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// ---------------------------------------------------------------
export const getFullEmployeeDetails = async (req, res) => {
  try {
    const { id } = req.params;

    /* =========================
       VALIDATE ID
    ========================= */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Employee ID",
      });
    }

    /* =========================
       EMPLOYEE DETAILS
    ========================= */
    const employee = await Employee.findById(id).lean();

    if (!employee) {
      return res.status(404).json({
        message: "Employee NOT Found",
      });
    }

    /* =========================
       SKILLS (FIX ✅)
    ========================= */
    let skills = [];

    if (employee.skills && employee.skills.length > 0) {
      const skillDocs = await Skill.find({
        _id: { $in: employee.skills },
      });

      skills = skillDocs.map((s) => s.name);
    }

    /* =========================
       ALLOCATIONS
    ========================= */
    const allocations = await Allocation.find({
      employeeId: id,
    }).populate("projectId");

    /* =========================
       FORMAT + CALCULATE (FIX ✅)
    ========================= */
    const formattedAllocations = allocations.map((a) => {
      const revenue =
        a.isBillable && a.rateSnapshot
          ? a.allocatedHours * a.rateSnapshot
          : 0;

      const cost = employee.hourlyCost
        ? a.allocatedHours * employee.hourlyCost
        : a.cost || 0;

      return {
        project_name: a.projectId?.name || "N/A",
        month: a.month,
        year: a.year,
        allocated_hours: a.allocatedHours,
        fte: a.allocationFTE,
        billable: a.isBillable,
        billing_type: a.billingType,
        rate: a.rateSnapshot,
        revenue,
        cost,
      };
    });

    /* =========================
       FINANCIAL SUMMARY (FIX ✅)
    ========================= */
    let totalRevenue = 0;
    let totalCost = 0;
    let totalHours = 0;

    formattedAllocations.forEach((a) => {
      totalRevenue += a.revenue;
      totalCost += a.cost;
      totalHours += a.allocated_hours;
    });

    const profit = totalRevenue - totalCost;

    /* =========================
       RESPONSE
    ========================= */
    res.json({
      employee: {
        name: employee.name,
        email: employee.email,
        employeeCode: employee.employeeCode,
        departmentId: employee.departmentId,
        location: employee.location,
        joiningDate: employee.joiningDate,
        status: employee.status,
        monthlySalary: employee.monthlySalary,
        hourlyCost: employee.hourlyCost,
      },

      skills,

      allocations: formattedAllocations,

      financial_summary: {
        total_hours: totalHours,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        profit,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error Fetching Employee Report",
    });
  }
};

// ---------------------------------------------------------------
export const getAllEmployeesReport = async (req, res) => {
  try {
    const employees = await Employee.find().lean();

    const result = [];

    for (const emp of employees) {
      /* =========================
         SKILLS
      ========================= */
      let skills = [];

      if (emp.skills?.length) {
        const skillDocs = await Skill.find({
          _id: { $in: emp.skills },
        });

        skills = skillDocs.map((s) => s.name);
      }

      /* =========================
         ALLOCATIONS
      ========================= */
      const allocations = await Allocation.find({
        employeeId: emp._id,
      }).populate("projectId");

      let totalRevenue = 0;
      let totalCost = 0;
      let totalHours = 0;

      const detailedAllocations = allocations.map((a) => {
        const revenue =
          a.isBillable && a.rateSnapshot
            ? a.allocatedHours * a.rateSnapshot
            : 0;

        const cost = emp.hourlyCost
          ? a.allocatedHours * emp.hourlyCost
          : a.cost || 0;

        totalRevenue += revenue;
        totalCost += cost;
        totalHours += a.allocatedHours;

        return {
          project_name: a.projectId?.name || "N/A",
          month: a.month,
          year: a.year,
          hours: a.allocatedHours,
          fte: a.allocationFTE,
          billable: a.isBillable,
          rate: a.rateSnapshot,
          revenue,
          cost,
        };
      });

      /* =========================
         FINAL STRUCTURE ✅
      ========================= */
      result.push({
        name: emp.name,
        email: emp.email,
        skills,
        allocations: detailedAllocations, // ✅ NOW INCLUDED
        summary: {
          total_hours: totalHours,
          total_revenue: totalRevenue,
          total_cost: totalCost,
          profit: totalRevenue - totalCost,
        },
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error Exporting Data",
    });
  }
};