import { useEffect, useState, useCallback } from "react";
import {
  fetchUtilization,
  fetchBench,
  fetchRevenue,
  fetchProjectHealth,
  fetchMoveSuggestions,
} from "../api/analyticsAPI";

/* ================= TYPES ================= */

export type UtilizationRow = {
  employeeId?: string;
  allocatedHours: number;
  utilizationPct: number;
};

export type BenchEmployee = {
  name: string;
  employeeCode: string;
  idleHours: number;
};

export type RevenueRow = {
  projectName: string;
  month: string;
  revenue: number;
};

export type ProjectHealth = {
  projectName: string;
  healthScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

export type MoveSuggestion = {
  message: string;
};

/* ================= SAFE EXTRACT ================= */

function extractArray<T>(res: any, label: string): T[] {
  try {
    if (!res) throw new Error("Empty response");

    // Case 1: Direct array
    if (Array.isArray(res)) return res;

    // Case 2: Axios standard
    if (Array.isArray(res?.data)) return res.data;

    // Case 3: Nested object
    if (res?.data && typeof res.data === "object") {
      for (const key of Object.keys(res.data)) {
        if (Array.isArray(res.data[key])) {
          console.log(`✅ ${label} extracted from key: ${key}`);
          return res.data[key];
        }
      }
    }

    console.warn(`⚠️ ${label} - No array found`, res);
    return [];

  } catch (e) {
    console.error(`❌ ${label} extraction failed`, e);
    return [];
  }
}

/* ================= HOOK ================= */

export function useAnalytics(month: number, year: number) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [utilization, setUtilization] = useState<UtilizationRow[]>([]);
  const [bench, setBench] = useState<BenchEmployee[]>([]);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([]);
  const [suggestions, setSuggestions] = useState<MoveSuggestion[]>([]);

  /* ================= FETCH FUNCTION ================= */

  const loadAnalytics = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const [
        utilRes,
        benchRes,
        revRes,
        healthRes,
        suggestRes,
      ] = await Promise.all([
        fetchUtilization(month, year),
        fetchBench(month, year),
        fetchRevenue(month, year),
        fetchProjectHealth(month, year),
        fetchMoveSuggestions(),
      ]);

      if (signal?.aborted) return;

      const utilData = extractArray<UtilizationRow>(utilRes, "Utilization");
      const benchData = extractArray<BenchEmployee>(benchRes, "Bench");
      const revenueData = extractArray<RevenueRow>(revRes, "Revenue");
      const healthData = extractArray<ProjectHealth>(healthRes, "ProjectHealth");
      const suggestionData = extractArray<MoveSuggestion>(suggestRes, "Suggestions");

      console.log("📊 DATA DEBUG", {
        utilData,
        benchData,
        revenueData,
        healthData,
        suggestionData,
      });

      setUtilization(utilData);
      setBench(benchData);
      setRevenue(revenueData);
      setProjectHealth(healthData);
      setSuggestions(suggestionData);

    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        console.error("🔥 API FAILURE:", err);
        setError("Backend API failed");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [month, year]);

  /* ================= EFFECT ================= */

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics(controller.signal);

    return () => controller.abort();
  }, [loadAnalytics]);

  /* ================= RETURN ================= */

  return {
    loading,
    error,
    utilization,
    bench,
    revenue,
    projectHealth,
    suggestions,
    refetch: () => loadAnalytics(),
  };
}