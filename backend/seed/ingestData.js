import Employee from "../models/Employee.js";
import Document from "../models/Document.js";
import { getEmbedding } from "../services/embeddingService.js";

export async function ingestEmployees() {
  const employees = await Employee.find();

  for (const emp of employees) {
    const text = `
Employee: ${emp.name}
Role: ${emp.role}
Skills: ${emp.skills?.join(", ")}
Utilization: ${emp.utilization}
Department: ${emp.department}
    `;

    const embedding = await getEmbedding(text);

    await Document.create({
      text,
      embedding,
      metadata: {
        type: "employee",
        employeeId: emp._id,
      },
    });
  }
}