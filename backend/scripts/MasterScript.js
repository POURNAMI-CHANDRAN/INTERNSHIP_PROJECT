import Employee from "../models/Employee.js";
import Project from "../models/Project.js";
import Allocation from "../models/Allocation.js";
import AIDocument from "../models/AIDocument.js";
import { getEmbedding } from "../services/embeddingService.js";

/* ================= UPSERT HELPER ================= */
async function upsertDoc(filter, data) {
  return AIDocument.findOneAndUpdate(
    filter,
    data,
    { upsert: true, new: true }
  );
}

/* ================= MAIN BUILDER ================= */
export async function buildMasterAI() {
  try {
    console.log("🚀 Building AllocAI Brain...");

    const [employees, projects, allocations] =
      await Promise.all([
        Employee.find(),
        Project.find(),
        Allocation.find()
      ]);

    /* =====================================================
       1. EMPLOYEES
    ===================================================== */
    for (const emp of employees) {

      const empAllocations = allocations.filter(
        a => String(a.employeeId) === String(emp._id)
      );

      const allocatedHours = empAllocations.reduce(
        (sum, a) => sum + (a.allocatedHours || 0),
        0
      );

      const capacity = 160;
      const availableHours = Math.max(capacity - allocatedHours, 0);
      const utilization = (allocatedHours / capacity) * 100;

      const bench = utilization < 20;

      const text = `
Employee: ${emp.name}
Code: ${emp.employeeCode}
Location: ${emp.location}
Skills: ${(emp.skillsText || []).join(", ")}
Hourly Cost: ${emp.hourlyCost}
Allocated Hours: ${allocatedHours}
Available Hours: ${availableHours}
Utilization: ${utilization.toFixed(2)}%
Status: ${bench ? "Bench" : "Active"}
      `.trim();

      const embedding = await getEmbedding(text);

      await upsertDoc(
        {
          sourceType: "employee",
          sourceId: emp._id.toString()
        },
        {
          sourceType: "employee",
          sourceId: emp._id.toString(),
          text,
          embedding,
          metadata: {
            name: emp.name,
            location: emp.location,
            skills: emp.skillsText || [],
            hourlyCost: emp.hourlyCost,
            allocatedHours,
            availableHours,
            utilization,
            bench,
            status: emp.status
          }
        }
      );
    }

    /* =====================================================
       2. PROJECTS
    ===================================================== */
    for (const proj of projects) {

      const text = `
Project: ${proj.name}
Type: ${proj.type}
Billing Model: ${proj.billingModel}
Status: ${proj.status}
Billing Rate: ${proj.billingRate}
Active: ${proj.status === "ACTIVE"}
      `.trim();

      const embedding = await getEmbedding(text);

      await upsertDoc(
        {
          sourceType: "project",
          sourceId: proj._id.toString()
        },
        {
          sourceType: "project",
          sourceId: proj._id.toString(),
          text,
          embedding,
          metadata: {
            name: proj.name,
            type: proj.type,
            status: proj.status,
            billingModel: proj.billingModel,
            billingRate: proj.billingRate,
            active: proj.status === "ACTIVE"
          }
        }
      );
    }

    /* =====================================================
       3. DONE
    ===================================================== */
    console.log("✅ AllocAI Master Brain Ready");

  } catch (err) {
    console.error("❌ Master AI Build Failed:", err);
  }
}