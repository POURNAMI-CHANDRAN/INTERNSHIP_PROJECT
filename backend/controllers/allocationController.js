import Allocation from "../models/Allocation.js";
import Employee from "../models/Employee.js";
import Project from "../models/Project.js";

const MONTHLY_CAPACITY = 160;

/* =========================================================
   HELPER: CALCULATE FINANCIALS
========================================================= */
const calculateFinancials = async ({
  employee,
  project,
  hours,
  fte,
  month,
  year,
  isBillable,
}) => {
  let rateSnapshot = 0;
  let revenue = 0;
  let cost = 0;

  /* ================= COST ================= */
  cost = hours * (employee.hourlyCost || 0);

  if (!isBillable) {
    return { rateSnapshot: 0, revenue: 0, cost };
  }

  /* ================= BILLING ================= */

  // 🔹 Hourly Project
  if (project.billingModel === "Hourly") {
    rateSnapshot = Number(project.billingRate || 0);
    revenue = rateSnapshot * hours;
  }

  // 🔹 Fixed Monthly Project
  else if (project.billingModel === "Fixed") {
    const projectAllocations = await Allocation.find({
      projectId: project._id,
      month,
      year,
    });

    const totalFTE =
      projectAllocations.reduce((s, a) => s + a.allocationFTE, 0) + fte;

    const totalRevenue = Number(project.fixedMonthlyRevenue || 0);

    revenue = totalFTE > 0 ? (fte / totalFTE) * totalRevenue : 0;

    // normalized hourly rate (for analytics)
    rateSnapshot = totalRevenue / MONTHLY_CAPACITY;
  }

  return { rateSnapshot, revenue, cost };
};

/* =========================================================
   HELPER: REDISTRIBUTE FIXED PROJECT REVENUE
========================================================= */
const redistributeFixedRevenue = async (projectId, month, year) => {
  const project = await Project.findById(projectId);

  if (!project || project.billingModel !== "Fixed") return;

  const allocations = await Allocation.find({
    projectId,
    month,
    year,
  });

  const totalFTE = allocations.reduce(
    (s, a) => s + a.allocationFTE,
    0
  );

  const totalRevenue = Number(project.fixedMonthlyRevenue || 0);

  for (let a of allocations) {
    a.revenue =
      totalFTE > 0
        ? (a.allocationFTE / totalFTE) * totalRevenue
        : 0;

    await a.save();
  }
};

/* =========================================================
   CREATE ALLOCATION
========================================================= */
export const createAllocation = async (req, res) => {
  try {
    const {
      employeeId,
      projectId,
      workCategoryId,
      month,
      year,
      allocatedHours,
      allocationFTE,
      isBillable,
      billingType,
      startDate,
      endDate,
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee NOT Found" });

    const project = await Project.findById(projectId);
    if (!project)
      return res.status(404).json({ message: "Project NOT Found" });

    const hours = Number(
      allocatedHours ||
        (allocationFTE ? allocationFTE * MONTHLY_CAPACITY : 0)
    );

    if (hours < 0 || isNaN(hours)) {
      return res.status(400).json({ message: "Invalid Hours" });
    }

    if (hours > MONTHLY_CAPACITY) {
      return res.status(400).json({ message: "Exceeds 160h" });
    }

    /* ================= CAPACITY CHECK ================= */
    const existing = await Allocation.find({
      employeeId,
      month,
      year,
    });

    const totalAllocated = existing.reduce(
      (s, a) => s + a.allocatedHours,
      0
    );

    if (hours > 0 && totalAllocated + hours > MONTHLY_CAPACITY) {
      return res.status(400).json({ message: "Over Allocation" });
    }

    const fte = hours / MONTHLY_CAPACITY;

    const { rateSnapshot, revenue, cost } =
      await calculateFinancials({
        employee,
        project,
        hours,
        fte,
        month,
        year,
        isBillable,
      });

    const allocation = await Allocation.create({
      employeeId,
      projectId,
      workCategoryId,
      month,
      year,
      allocatedHours: hours,
      allocationFTE: Number(fte.toFixed(4)),
      isBillable,
      billingType:
        billingType || (isBillable ? "Billable" : "Non-Billable"),
      startDate,
      endDate,
      rateSnapshot,
      revenue,
      cost,
    });

    // 🔥 redistribute if fixed project
    await redistributeFixedRevenue(projectId, month, year);

    res.status(201).json({ success: true, data: allocation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   UPDATE ALLOCATION
========================================================= */
export const updateAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation)
      return res.status(404).json({ message: "Allocation NOT Found" });

    const {
      allocatedHours,
      allocationFTE,
      isBillable,
      billingType,
      startDate,
      endDate,
    } = req.body;

    const employee = await Employee.findById(
      allocation.employeeId
    );
    const project = await Project.findById(
      allocation.projectId
    );

    const hours = Number(
      allocatedHours ||
        (allocationFTE
          ? allocationFTE * MONTHLY_CAPACITY
          : allocation.allocatedHours)
    );

    if (hours < 0 || isNaN(hours)) {
      return res.status(400).json({ message: "Invalid Hours" });
    }

    /* ================= CAPACITY CHECK ================= */
    const others = await Allocation.find({
      employeeId: allocation.employeeId,
      month: allocation.month,
      year: allocation.year,
      _id: { $ne: allocation._id },
    });

    const otherHours = others.reduce(
      (s, a) => s + a.allocatedHours,
      0
    );

    if (otherHours + hours > MONTHLY_CAPACITY) {
      return res.status(400).json({ message: "Over Allocation" });
    }

    const fte = hours / MONTHLY_CAPACITY;

    const finalBillable =
      isBillable ?? allocation.isBillable;

    const { rateSnapshot, revenue, cost } =
      await calculateFinancials({
        employee,
        project,
        hours,
        fte,
        month: allocation.month,
        year: allocation.year,
        isBillable: finalBillable,
      });

    allocation.allocatedHours = hours;
    allocation.allocationFTE = Number(fte.toFixed(4));
    allocation.rateSnapshot = rateSnapshot;
    allocation.revenue = revenue;
    allocation.cost = cost;

    allocation.isBillable = finalBillable;
    allocation.billingType =
      billingType ||
      allocation.billingType ||
      (finalBillable ? "Billable" : "Non-Billable");

    allocation.startDate = startDate || allocation.startDate;
    allocation.endDate = endDate || allocation.endDate;

    await allocation.save();

    await redistributeFixedRevenue(
      allocation.projectId,
      allocation.month,
      allocation.year
    );

    res.json({ success: true, data: allocation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   MOVE ALLOCATION
========================================================= */
export const moveAllocation = async (req, res) => {
  const session = await Allocation.startSession();
  session.startTransaction();

  try {
    const { newProjectId, moveHours } = req.body;

    const allocation = await Allocation.findById(
      req.params.id
    ).session(session);

    if (!allocation)
      return res.status(404).json({ message: "Not Found" });

    if (moveHours > allocation.allocatedHours) {
      return res.status(400).json({ message: "Invalid Move" });
    }

    const existingTarget = await Allocation.findOne({
      employeeId: allocation.employeeId,
      projectId: newProjectId,
      month: allocation.month,
      year: allocation.year,
    }).session(session);

    allocation.allocatedHours -= moveHours;

    if (allocation.allocatedHours === 0) {
      await allocation.deleteOne({ session });
    } else {
      allocation.allocationFTE =
        allocation.allocatedHours / MONTHLY_CAPACITY;
      await allocation.save({ session });
    }

    if (existingTarget) {
      existingTarget.allocatedHours += moveHours;
      existingTarget.allocationFTE =
        existingTarget.allocatedHours / MONTHLY_CAPACITY;
      await existingTarget.save({ session });
    } else {
      await Allocation.create(
        [
          {
            employeeId: allocation.employeeId,
            projectId: newProjectId,
            workCategoryId: allocation.workCategoryId,
            month: allocation.month,
            year: allocation.year,
            allocatedHours: moveHours,
            allocationFTE: moveHours / MONTHLY_CAPACITY,
            isBillable: allocation.isBillable,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Moved" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Move Failed" });
  }
};

/* =========================================================
   GET ALL
========================================================= */
export const getAllAllocations = async (req, res) => {
  try {
    const { month, year } = req.query;

    const query = {};

    if (year) query.year = Number(year);
    if (month) query.month = Number(month);

    const allocations = await Allocation.find(query)
      .populate("employeeId", "name employeeId primaryWorkCategoryId location")
      .populate("projectId", "name billingModel type");

    res.json({
      success: true,
      data: allocations,
    });
  } catch (err) {
    console.error("Getting Allocation Failed:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   GROUP BY EMPLOYEE
========================================================= */
export const getAllocationsByEmployee = async (req, res) => {
  try {
    const { month, year } = req.query;

    const allocations = await Allocation.find({
      month: Number(month),
      year: Number(year),
    }).populate("employeeId", "name");

    const grouped = {};

    allocations.forEach((a) => {
      const id = a.employeeId._id;

      if (!grouped[id]) {
        grouped[id] = {
          employee: a.employeeId,
          totalHours: 0,
          totalRevenue: 0,
          totalCost: 0,
          allocations: [],
        };
      }

      grouped[id].totalHours += a.allocatedHours;
      grouped[id].totalRevenue += a.revenue || 0;
      grouped[id].totalCost += a.cost || 0;
      grouped[id].allocations.push(a);
    });

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};