import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

let employeeId = "";
let projectId1 = "";
let projectId2 = "";

const runTests = async () => {
  try {
    console.log("🚀 STARTING API TESTS...\n");

    // =========================
    // 1. CREATE EMPLOYEE
    // =========================
    const empRes = await axios.post(`${BASE_URL}/employees`, {
      name: "John Doe",
      email: "john@test.com",
      role: "Engineering",
      skills: ["React", "Node"],
      billingRate: 50
    });

    employeeId = empRes.data._id;
    console.log("✅ Employee Created:", employeeId);

    // =========================
    // 2. CREATE PROJECTS
    // =========================
    const proj1 = await axios.post(`${BASE_URL}/projects`, {
      name: "Project A",
      client: "Google",
      budget: 10000
    });

    const proj2 = await axios.post(`${BASE_URL}/projects`, {
      name: "Project B",
      client: "Microsoft",
      budget: 20000
    });

    projectId1 = proj1.data._id;
    projectId2 = proj2.data._id;

    console.log("✅ Projects Created");

    // =========================
    // 3. ALLOCATION (60-40)
    // =========================
    await axios.post(`${BASE_URL}/allocations`, {
      employeeId,
      allocations: [
        { projectId: projectId1, percentage: 60 },
        { projectId: projectId2, percentage: 40 }
      ]
    });

    console.log("✅ Allocation Done");

    // =========================
    // 4. ADD TIMESHEET
    // =========================
    await axios.post(`${BASE_URL}/timesheets`, {
      employeeId,
      projectId: projectId1,
      hoursWorked: 8,
      date: "2026-03-17"
    });

    console.log("✅ Timesheet Added");

    // =========================
    // 5. GET BILLING
    // =========================
    const billing = await axios.get(`${BASE_URL}/billing`);
    console.log("💰 Billing:", billing.data);

    // =========================
    // 6. GET REPORT
    // =========================
    const report = await axios.get(`${BASE_URL}/reports/utilization`);
    console.log("📊 Utilization:", report.data);

    // =========================
    // 7. GET ALL EMPLOYEES
    // =========================
    const employees = await axios.get(`${BASE_URL}/employees`);
    console.log("👨‍💼 Employees Count:", employees.data.length);

    // =========================
    // 8. UPDATE EMPLOYEE
    // =========================
    await axios.put(`${BASE_URL}/employees/${employeeId}`, {
      role: "Finance"
    });

    console.log("✏️ Employee Updated");

    // =========================
    // 9. DELETE EMPLOYEE
    // =========================
    await axios.delete(`${BASE_URL}/employees/${employeeId}`);
    console.log("❌ Employee Deleted");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ TEST FAILED:", error.response?.data || error.message);
  }
};

runTests();