import mongoose from "mongoose";
import dotenv from "dotenv";
import role from "../models/role.js";
import WorkCategory from "../models/WorkCategory.js";
import Client from "../models/Client.js";
import Employee from "../models/Employee.js";
import Project from "../models/Project.js";
import Allocation from "../models/Allocation.js";

dotenv.config();

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();
const afterOption = { upsert: true, returnDocument: "after" };

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const role = await role.findOneAndUpdate(
      { name: "Engineering" },
      { $setOnInsert: { description: "Delivery engineering unit" } },
      afterOption
    );

    const deliveryCategory = await WorkCategory.findOneAndUpdate(
      { name: "DELIVERY" },
      {
        $setOnInsert: {
          allowedBillingTypes: ["Billable", "Non-Billable"],
          status: "Active",
        },
      },
      afterOption
    );

    const shadowCategory = await WorkCategory.findOneAndUpdate(
      { name: "SHADOW" },
      {
        $setOnInsert: {
          allowedBillingTypes: ["Non-Billable"],
          status: "Active",
        },
      },
      afterOption
    );

    const clientA = await Client.findOneAndUpdate(
      { client_name: "Acme Corp" },
      { $setOnInsert: { industry: "Fintech", country: "IN", isActive: true } },
      afterOption
    );

    const clientB = await Client.findOneAndUpdate(
      { client_name: "Globex" },
      { $setOnInsert: { industry: "Retail", country: "US", isActive: true } },
      afterOption
    );

    const john = await Employee.findOneAndUpdate(
      { email: "john.billing@abc.com" },
      {
        $set: {
          name: "John",
          roleId: role._id,
          primaryWorkCategoryId: deliveryCategory._id,
          monthlySalary: 200000,
          hourlyCost: 1250,
          status: "Active",
          location: "Chennai",
          joiningDate: new Date("2024-01-10"),
        },
        $setOnInsert: { employeeCode: "EMP-JOHN-01" },
      },
      afterOption
    );

    const priya = await Employee.findOneAndUpdate(
      { email: "priya.billing@abc.com" },
      {
        $set: {
          name: "Priya",
          roleId: role._id,
          primaryWorkCategoryId: deliveryCategory._id,
          monthlySalary: 160000,
          hourlyCost: 1000,
          status: "Active",
          location: "Bengaluru",
          joiningDate: new Date("2023-04-20"),
        },
        $setOnInsert: { employeeCode: "EMP-PRIYA-01" },
      },
      afterOption
    );

    const rahul = await Employee.findOneAndUpdate(
      { email: "rahul.billing@abc.com" },
      {
        $set: {
          name: "Rahul",
          roleId: role._id,
          primaryWorkCategoryId: shadowCategory._id,
          monthlySalary: 140000,
          hourlyCost: 875,
          status: "Active",
          location: "Pune",
          joiningDate: new Date("2025-02-11"),
        },
        $setOnInsert: { employeeCode: "EMP-RAHUL-01" },
      },
      afterOption
    );

    const projectA = await Project.findOneAndUpdate(
      { name: "Project A" },
      {
        $set: {
          client_id: clientA._id,
          type: "Billable",
          billingModel: "Hourly",
          billingRate: 2500,
          status: "ACTIVE",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
        },
      },
      afterOption
    );

    const projectB = await Project.findOneAndUpdate(
      { name: "Project B" },
      {
        $set: {
          client_id: clientB._id,
          type: "Billable",
          billingModel: "Hourly",
          billingRate: 2000,
          status: "ACTIVE",
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-10-30"),
        },
      },
      afterOption
    );

    const projectC = await Project.findOneAndUpdate(
      { name: "Project C" },
      {
        $set: {
          client_id: clientA._id,
          type: "Billable",
          billingModel: "Fixed",
          fixedMonthlyRevenue: 320000,
          status: "ACTIVE",
          startDate: new Date("2026-03-01"),
          endDate: new Date("2026-12-31"),
        },
      },
      afterOption
    );

    const internalProject = await Project.findOneAndUpdate(
      { name: "Internal Enablement" },
      {
        $set: {
          client_id: clientA._id,
          type: "Non-Billable",
          billingModel: "Fixed",
          fixedMonthlyRevenue: 0,
          status: "ACTIVE",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
        },
      },
      afterOption
    );

    await Allocation.deleteMany({
      month,
      year,
      employeeId: { $in: [john._id, priya._id, rahul._id] },
    });

    await Allocation.insertMany([
      {
        employeeId: john._id,
        projectId: projectA._id,
        workCategoryId: deliveryCategory._id,
        month,
        year,
        allocationFTE: 0.6,
        allocatedHours: 96,
        billingType: "Billable",
        isBillable: true,
        rateSnapshot: 2500,
      },
      {
        employeeId: john._id,
        projectId: projectB._id,
        workCategoryId: deliveryCategory._id,
        month,
        year,
        allocationFTE: 0.4,
        allocatedHours: 64,
        billingType: "Billable",
        isBillable: true,
        rateSnapshot: 2000,
      },
      {
        employeeId: priya._id,
        projectId: projectC._id,
        workCategoryId: deliveryCategory._id,
        month,
        year,
        allocationFTE: 0.5,
        allocatedHours: 80,
        billingType: "Billable",
        isBillable: true,
        rateSnapshot: 320000,
      },
      {
        employeeId: priya._id,
        projectId: internalProject._id,
        workCategoryId: shadowCategory._id,
        month,
        year,
        allocationFTE: 0.25,
        allocatedHours: 40,
        billingType: "Shadow",
        isBillable: false,
        rateSnapshot: 0,
      },
      {
        employeeId: rahul._id,
        projectId: internalProject._id,
        workCategoryId: shadowCategory._id,
        month,
        year,
        allocationFTE: 1,
        allocatedHours: 160,
        billingType: "Non-Billable",
        isBillable: false,
        rateSnapshot: 0,
      },
    ]);

    console.log("✅ Billing system seed completed");
    console.log(`📌 Seeded month/year: ${month}/${year}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Billing seed failed:", error.message);
    process.exit(1);
  }
};

run();
