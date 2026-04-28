import Employee from "../models/Employee.js";
import { getEmbedding } from "./embeddingService.js";

export async function askRAG(question) {
  try {
    const embedding = await getEmbedding(question);

    // ✅ REAL BENCH LOGIC (FREE + SIMPLE)
    const employees = await Employee.find({
    status: "Active",
    $or: [
        { projectId: { $exists: false } },
        { projectId: null },
        { allocationPercent: { $lt: 30 } }
    ]
    }).lean();

    // fallback if empty
    if (!employees.length) {
      return {
        answer: "No employees currently on bench.",
        data: []
      };
    }

    const context = employees.map(e => ({
      name: e.name,
      role: e.role || "Unknown",
      skills: e.skills || [],
      location: e.location,
      cost: e.hourlyCost || 0
    }));

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      // 🔥 IMPORTANT FIX BELOW
      body: JSON.stringify({
        model: "llama3",
        stream: false,   // ✅ FIX JSON ERROR
        messages: [
          {
            role: "system",
            content: `You are a strict HR assistant. Use ONLY given data.`
          },
          {
            role: "user",
            content: `
Question: ${question}

Employees:
${JSON.stringify(context, null, 2)}
            `
          }
        ]
      })
    });

    const data = await response.json();

    return {
      answer: data?.message?.content || "No response",
      data: context
    };

  } catch (err) {
    console.error("RAG ERROR:", err);

    return {
      answer: "AI Service Failed",
      data: []
    };
  }
}