import Timesheet from "../models/Timesheet.js";
import Employee from "../models/Employee.js";
import Project from "../models/Project.js";
import Bench from "../models/Bench.js";
import { validateTimesheetDate } from "../utils/dateValidator.js";

//
// 1️⃣ SUBMIT TIMESHEET (Employee)
//
export const submitTimesheet = async (req, res) => {
  try {
    const {
      employee_id,
      project_id,
      story_id,
      story_points_completed,
      work_date
    } = req.body;

    // Validate date
    const dateCheck = validateTimesheetDate(work_date);
    if (!dateCheck.valid)
      return res.status(400).json({ message: dateCheck.message });

    const workDateObj = new Date(work_date);

    // Duplicate prevention
    const exists = await Timesheet.findOne({
      employee_id,
      story_id,
      work_date: workDateObj
    });

    if (exists) {
      return res.status(400).json({
        message: "Timesheet already Exists for this Story on this Date"
      });
    }

    // Check employee
    const emp = await Employee.findById(employee_id);
    if (!emp) return res.status(404).json({ message: "Employee NOT Found" });

    // Check project
    const proj = await Project.findById(project_id);
    if (!proj) return res.status(404).json({ message: "Project NOT Found" });

    // Check Bench
    const Bench = await Bench.findById(story_id);
    if (!Bench) return res.status(404).json({ message: "Bench NOT Found" });

    // Create timesheet
    const sheet = await Timesheet.create({
      employee_id,
      project_id,
      story_id,
      story_points_completed,
      work_date: workDateObj,
      status: "Pending",
      audit: { created_by: req.user.name }
    });

    res.json({ data: sheet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 2️⃣ APPROVE TIMESHEET (Admin / Finance)
//
export const approveTimesheet = async (req, res) => {
  const ts = await Timesheet.findById(req.params.id);
  if (!ts) return res.status(404).json({ message: "Timesheet NOT Found" });

  ts.status = "Approved";
  ts.audit.updated_by = req.user.name;
  await ts.save();

  res.json(ts);
};

//
// 3️⃣ REJECT TIMESHEET (Admin / Finance)
//
export const rejectTimesheet = async (req, res) => {
  try {
    const ts = await Timesheet.findById(req.params.id);

    if (!ts) {
      return res.status(404).json({ message: "Timesheet NOT Found" });
    }

    const reason = req.body?.reason ?? "No Reason Provided";

    ts.status = "Rejected";
    ts.notes = reason;
    ts.audit.updated_by = req.user.name;

    await ts.save();

    res.json(ts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTimesheetsByEmployee = async (req, res) => {
  try {
    const ts = await Timesheet.find({ employee_id: req.params.id })
      .populate("project_id", "name")
      .populate("story_id", "title story_points");

    res.json({ success: true, data: ts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 4️⃣ GET HISTORY
//
export const getTimesheetHistory = async (req, res) => {
  const data = await Timesheet.find()
    .populate("employee_id", "name")
    .populate("project_id", "name")
    .populate("story_id", "title story_points");

  res.json(data);
};