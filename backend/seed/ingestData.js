import Employee from "../models/Employee.js";
import Document from "../models/Document.js";
import { getEmbedding } from "../services/embeddingService.js";

export async function ingestEmployees() {
  try {
    const employees = await Employee.find();

    for (const emp of employees) {
      const skills =
        Array.isArray(emp.skills)
          ? emp.skills.join(", ")
          : "";

      const text = `
Employee Name: ${emp.name || ""}
Employee Code: ${emp.employeeCode || ""}
Email: ${emp.email || ""}
Location: ${emp.location || ""}
Status: ${emp.status || ""}
Hourly Cost: ${emp.hourlyCost || 0}
Monthly Salary: ${emp.monthlySalary || 0}
Skills: ${skills}
role: ${emp.roleText || ""}
      `.trim();

      const embedding = await getEmbedding(text);

      await Document.findOneAndUpdate(
        { "metadata.employeeId": emp._id },
        {
          text,
          embedding,
          metadata: {
            type: "employee",
            employeeId: emp._id,
            name: emp.name,
            employeeCode: emp.employeeCode,
            location: emp.location,
            hourlyCost: emp.hourlyCost,
            skills: emp.skills
          }
        },
        {
          upsert: true,
          new: true
        }
      );
    }

    console.log("✅ Employees Ingested Successfully");
  } catch (error) {
    console.error("❌ Employee Ingestion Failed:", error);
  }
}