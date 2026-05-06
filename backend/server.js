import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import allocationRoutes from "./routes/allocationRoutes.js";
import timesheetRoutes from "./routes/timesheetRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import employeeSkillRoutes from "./routes/employeeSkillRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import equivalentRoutes from "./routes/equivalentRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chat.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import workcategoryRoutes from "./routes/workcategoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import Equivalent from "./models/Equivalent.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/timesheets", timesheetRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/employee-skills", employeeSkillRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/equivalents", equivalentRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/workcategories", workcategoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("API is Running 🚀");
});

app.listen(5000, () => console.log("🚀 Server Port 5000"));

console.log("JWT SECRET : ", process.env.JWT_SECRET);
