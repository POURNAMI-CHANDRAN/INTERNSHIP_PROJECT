// FILE: scripts/importAllocations.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import XLSX from "xlsx";

import Employee from "../models/Employee.js";
import Project from "../models/Project.js";
import WorkCategory from "../models/WorkCategory.js";
import Allocation from "../models/Allocation.js";

dotenv.config();

/* =========================================================
   DB CONNECT
========================================================= */

await mongoose.connect(process.env.MONGO_URI);

console.log("✅ MongoDB Connected:", mongoose.connection.name);

/* =========================================================
   EXCEL FILE
========================================================= */

const FILE_PATH = "./employees.xlsx";

/* =========================================================
   HELPERS (CRITICAL FIX)
========================================================= */

const normalize = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* =========================================================
   READ EXCEL
========================================================= */

const workbook = XLSX.readFile(FILE_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

const rawData = XLSX.utils.sheet_to_json(sheet, {
  defval: "",
});

console.log(`✅ Total Excel Rows: ${rawData.length}`);

/* =========================================================
   FETCH MASTER DATA
========================================================= */

const employees = await Employee.find({}, { name: 1 });
const projects = await Project.find({}, { name: 1 });
const workCategories = await WorkCategory.find({}, { name: 1 });

/* =========================================================
   MAPS (SAFE NORMALIZED KEYS)
========================================================= */

const employeeMap = {};
employees.forEach(e => {
  employeeMap[normalize(e.name)] = e._id;
});

const projectMap = {};
projects.forEach(p => {
  projectMap[normalize(p.name)] = p._id;
});

const wcMap = {};
workCategories.forEach(w => {
  wcMap[normalize(w.name)] = w._id;
});

/* =========================================================
   CONSTANTS
========================================================= */

const MONTH = 6;   // June
const YEAR = 2026;
const MONTHLY_CAPACITY = 160;

/* =========================================================
   DEDUP MAP (IMPORTANT FIX)
========================================================= */

const allocationMap = new Map();

/* =========================================================
   PROCESS ROWS
========================================================= */

for (const row of rawData) {
  try {
    const empName = normalize(row["Emp Name"]);
    const projectName = normalize(row["Project Name"]);
    const wcName = normalize(row["Work Category"]);

    // 🔥 FLEXIBLE FTE COLUMN HANDLING
    const fte =
      Number(row["Jun-26"] ||
             row["Jun-26 (FTE)"] ||
             row["FTE"] ||
             0);

    if (!empName || !projectName || fte === 0) {
      continue;
    }

    const employeeId = employeeMap[empName] || null;
    const projectId = projectMap[projectName] || null;
    const workCategoryId = wcMap[wcName] || null;

    // ❌ skip only if core data missing
    if (!employeeId || !projectId) {
      console.log(`❌ Missing Mapping: ${row["Emp Name"]}`);
      continue;
    }

    const allocatedHours = Math.round(fte * MONTHLY_CAPACITY);

    /* =====================================================
       DEDUP LOGIC (FIX DUPLICATE KEY ERROR)
    ===================================================== */

    const key = `${employeeId}_${projectId}_${MONTH}_${YEAR}_${workCategoryId || "null"}`;

    if (allocationMap.has(key)) {
      // merge duplicates
      allocationMap.get(key).allocatedHours += allocatedHours;
    } else {
      allocationMap.set(key, {
        employeeId,
        projectId,
        workCategoryId, // can be null safely
        month: MONTH,
        year: YEAR,
        allocatedHours,
        isBillable: true,
      });
    }

  } catch (err) {
    console.log("❌ Row Error:", err.message);
  }
}

/* =========================================================
   FINAL ARRAY
========================================================= */

const allocations = Array.from(allocationMap.values());

console.log(`✅ Prepared Allocations: ${allocations.length}`);

/* =========================================================
   BULK INSERT (SAFE)
========================================================= */

if (allocations.length > 0) {
  try {
    const result = await Allocation.insertMany(allocations, {
      ordered: false,
    });

    console.log(`✅ Inserted Allocations: ${result.length}`);
  } catch (err) {
    console.log("❌ Bulk Insert Failed");
    console.log(err.message);
  }
} else {
  console.log("⚠️ No Allocations to Insert");
}

/* =========================================================
   DONE
========================================================= */

console.log("✅ Allocation Import Completed");
process.exit();