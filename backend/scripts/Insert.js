// FILE: scripts/importEmployees.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import XLSX from "xlsx";

import Employee from "../models/Employee.js";
import Role from "../models/Roles.js";
import WorkCategory from "../models/WorkCategory.js";
import Skill from "../models/Skill.js";

dotenv.config();

/* =========================================================
   CONNECT DATABASE
========================================================= */

try {
  await mongoose.connect(process.env.MONGO_URI);

  console.log(
    "✅ MongoDB Connected:",
    mongoose.connection.name
  );

} catch (err) {

  console.log(
    "❌ Mongo Connection Failed"
  );

  console.log(err.message);

  process.exit(1);
}

/* =========================================================
   EXCEL FILE
========================================================= */

const FILE_PATH = "./employees.xlsx";

/* =========================================================
   READ EXCEL
========================================================= */

const workbook =
  XLSX.readFile(FILE_PATH);

const sheetName =
  workbook.SheetNames[0];

const sheet =
  workbook.Sheets[sheetName];

const rawData =
  XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });

console.log(
  `✅ Total Excel Rows: ${rawData.length}`
);

/* =========================================================
   FETCH MASTER DATA
========================================================= */

const roles = await Role.find({
  status: "Active",
});

const workCategories =
  await WorkCategory.find({
    status: "Active",
  });

const skills = await Skill.find({
  status: "Active",
});

/* =========================================================
   MAPS
========================================================= */

const roleMap = {};

roles.forEach((r) => {

  roleMap[
    r.name.trim().toLowerCase()
  ] = r._id;
});

const workCategoryMap = {};

workCategories.forEach((w) => {

  workCategoryMap[
    w.name.trim().toLowerCase()
  ] = w._id;
});

/* =========================================================
   UNIQUE EMPLOYEES
========================================================= */

const uniqueEmployeesMap =
  new Map();

for (const row of rawData) {

  const rawName =
    row["Emp Name"] ??
    row["Employee Name"] ??
    row["name"] ??
    "";

  const name =
    String(rawName).trim();

  const workCategory = String(
    row["Work Category"] ??
    row["workCategory"] ??
    ""
  ).trim();

  const role = String(
    row["Role"] ??
    row["role"] ??
    ""
  ).trim();

  /* =========================
     SKIP INVALID ROWS
  ========================= */

  if (
    !name ||
    name === "#N/A" ||
    name === "NA" ||
    name === "null" ||
    name === "undefined" ||
    name === "100959" ||
    name.toLowerCase() === "project"
  ) {
    continue;
  }

  const uniqueKey =
    name.toLowerCase();

  if (
    !uniqueEmployeesMap.has(
      uniqueKey
    )
  ) {

    uniqueEmployeesMap.set(
      uniqueKey,
      {
        name,
        workCategory,
        role,
      }
    );
  }
}

const uniqueEmployees = [
  ...uniqueEmployeesMap.values(),
];

console.log(
  `✅ Unique Employees: ${uniqueEmployees.length}`
);

/* =========================================================
   EXISTING EMPLOYEES
========================================================= */

const existingEmployees =
  await Employee.find(
    {},
    {
      name: 1,
      email: 1,
      employeeId: 1,
    }
  );

const existingEmployeeNames =
  new Set(
    existingEmployees.map((e) =>
      e.name
        ?.trim()
        .toLowerCase()
    )
  );

const existingEmails =
  new Set(
    existingEmployees.map((e) =>
      e.email
        ?.trim()
        .toLowerCase()
    )
  );

const existingEmployeeIds =
  new Set(
    existingEmployees.map((e) =>
      e.employeeId?.trim()
    )
  );

/* =========================================================
   DEFAULT ROLE
========================================================= */

let defaultDeveloperRole =
  await Role.findOne({
    name: /^developer$/i,
  });

if (!defaultDeveloperRole) {

  defaultDeveloperRole =
    await Role.create({
      name: "Developer",
      status: "Active",
    });

  console.log(
    "✅ Default Developer Role Created"
  );
}

roleMap["developer"] =
  defaultDeveloperRole._id;

/* =========================================================
   DEFAULT WORK CATEGORY
========================================================= */

const defaultWorkCategory =
  workCategories.find(
    (w) =>
      w.name
        .trim()
        .toLowerCase() === "lcm"
  );

if (!defaultWorkCategory) {

  console.log(
    "❌ Default Work Category 'LCM' Missing"
  );

  process.exit(1);
}

/* =========================================================
   BUILD EMPLOYEES
========================================================= */

const employeesToInsert = [];

let employeeCounter = 100001;

for (const emp of uniqueEmployees) {

  try {

    const normalizedName =
      emp.name
        .trim()
        .toLowerCase();

    /* =========================
       SKIP IF EXISTS
    ========================= */

    if (
      existingEmployeeNames.has(
        normalizedName
      )
    ) {

      console.log(
        `⚠️ Already Exists: ${emp.name}`
      );

      continue;
    }

    /* =====================================================
       ROLE LOGIC
    ===================================================== */

    const normalizedRole =
      emp.role
        ?.trim()
        .toLowerCase() || "";

    let roleId =
      roleMap[normalizedRole] ||
      null;

    /* =========================
       PARTIAL MATCH
    ========================= */

    if (
      !roleId &&
      normalizedRole
    ) {

      const matchedRole =
        roles.find((r) =>
          normalizedRole.includes(
            r.name
              .trim()
              .toLowerCase()
          )
        );

      if (matchedRole) {

        roleId =
          matchedRole._id;
      }
    }

    /* =========================
       CREATE ROLE IF MISSING
    ========================= */

    if (!roleId) {

      const cleanRoleName =
        emp.role?.trim() ||
        "Developer";

      const normalizedCleanRole =
        cleanRoleName.toLowerCase();

      // CHECK CACHE AGAIN
      if (
        roleMap[
          normalizedCleanRole
        ]
      ) {

        roleId =
          roleMap[
            normalizedCleanRole
          ];

      } else {

        // CHECK DATABASE
        let existingRole =
          await Role.findOne({
            name: new RegExp(
              `^${cleanRoleName}$`,
              "i"
            ),
          });

        // CREATE ONLY IF NOT EXISTS
        if (!existingRole) {

          existingRole =
            await Role.create({
              name: cleanRoleName,
              status: "Active",
            });

          console.log(
            `✅ Created Role: ${cleanRoleName}`
          );
        }

        roleId =
          existingRole._id;

        // UPDATE CACHE
        roleMap[
          normalizedCleanRole
        ] = roleId;

        // UPDATE LOCAL ARRAY
        roles.push(existingRole);
      }
    }

    /* =========================
       FINAL FALLBACK
    ========================= */

    if (!roleId) {

      roleId =
        defaultDeveloperRole._id;
    }

    /* =========================
       WORK CATEGORY
    ========================= */

    const normalizedWC =
      emp.workCategory
        ?.trim()
        .toLowerCase() || "";

    let primaryWorkCategoryId =
      workCategoryMap[
        normalizedWC
      ] || null;

    /* =========================
       DEFAULT WORK CATEGORY
    ========================= */

    if (
      !primaryWorkCategoryId
    ) {

      primaryWorkCategoryId =
        defaultWorkCategory._id;
    }

    /* =========================
       DETECT SKILLS
    ========================= */

    const detectedSkills = [];

    for (const skill of skills) {

      const skillName =
        skill.name.toLowerCase();

      if (
        normalizedRole.includes(
          skillName
        )
      ) {

        detectedSkills.push(
          skill._id
        );
      }
    }

    /* =========================
       UNIQUE EMPLOYEE ID
    ========================= */

    let employeeId =
      employeeCounter.toString();

    while (
      existingEmployeeIds.has(
        employeeId
      )
    ) {

      employeeCounter++;

      employeeId =
        employeeCounter.toString();
    }

    existingEmployeeIds.add(
      employeeId
    );

    /* =========================
       EMPLOYEE CODE
    ========================= */

    const employeeCode =
      `EMP-${String(
        employeeCounter
      ).padStart(4, "0")}`;

    /* =========================
       UNIQUE EMAIL
    ========================= */

    const safeEmailName =
      emp.name
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(
          /[^a-z0-9 ]/g,
          ""
        )
        .replace(/\s+/g, ".")
        .replace(/\.+/g, ".");

    let email =
      `${safeEmailName}@company.com`;

    let emailCounter = 1;

    while (
      existingEmails.has(
        email.toLowerCase()
      )
    ) {

      email =
        `${safeEmailName}${emailCounter}@company.com`;

      emailCounter++;
    }

    existingEmails.add(
      email.toLowerCase()
    );

    /* =========================
       FINAL DOCUMENT
    ========================= */

    employeesToInsert.push({

      employeeId,

      employeeCode,

      name: emp.name,

      email,

      roleId,

      primaryWorkCategoryId,

      skills: detectedSkills,

      hourlyCost: 0,

      billingRate: 0,

      billingCurrency: "INR",

      monthlySalary: 0,

      status: "Active",
    });

    existingEmployeeNames.add(
      normalizedName
    );

    employeeCounter++;

  } catch (err) {

    console.log(
      `❌ Failed Employee: ${emp.name}`
    );

    console.log(err.message);
  }
}

/* =========================================================
   INSERT EMPLOYEES
========================================================= */

if (
  employeesToInsert.length > 0
) {

  try {

    const inserted =
      await Employee.insertMany(
        employeesToInsert,
        {
          ordered: false,
        }
      );

    console.log(
      `✅ Successfully Inserted ${inserted.length} Employees`
    );

  } catch (err) {

    console.log(
      "❌ INSERT MANY FAILED"
    );

    console.log(err.message);

    if (err.writeErrors) {

      err.writeErrors.forEach(
        (e) => {

          console.log(
            "❌ Failed:",
            e.err.op?.name ||
              "Unknown"
          );

          console.log(
            e.err.errmsg
          );
        }
      );
    }
  }

} else {

  console.log(
    "⚠️ No Employees To Insert"
  );
}

/* =========================================================
   VERIFY COUNT
========================================================= */

const finalCount =
  await Employee.countDocuments();

console.log(
  `✅ FINAL EMPLOYEE COUNT: ${finalCount}`
);

/* =========================================================
   FINISH
========================================================= */

console.log(
  "✅ Import Completed"
);

process.exit();