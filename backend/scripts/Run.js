/**
 * Run.js
 * Entry point to connect MongoDB and execute Master AI build
 * Node.js v18+ / v24 compatible (ES Modules)
 */

/* ================= ENV FIRST (CRITICAL) ================= */

// ✅ Must be FIRST — before ANY other imports that might read env
import dotenv from "dotenv";
dotenv.config();

/* ================= VALIDATE ENV ================= */

if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not defined.");
  console.error("👉 Ensure backend/.env contains MONGO_URI");
  process.exit(1);
}

/* ================= IMPORTS ================= */

import mongoose from "mongoose";
import { buildMasterAI } from "./MasterScript.js";

/* ================= MAIN ================= */

async function main() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    console.log("🤖 Running Master AI build...");
    await buildMasterAI();

    console.log("✅ Master AI build completed");
  } catch (error) {
    console.error("❌ Fatal error during execution");
    console.error(error);
    process.exit(1);
  } finally {
    console.log("🔌 Closing MongoDB connection...");
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
    process.exit(0);
  }
}

/* ================= RUN ================= */

await main();