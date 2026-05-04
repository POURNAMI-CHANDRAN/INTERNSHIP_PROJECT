import { useEffect, useState } from "react";
import {
  fetchUtilization,
  fetchBench,
  fetchRevenue,
  fetchProjectHealth,
  fetchMoveSuggestions,
} from "../api/analyticsAPI";

/* ============================================================
   DOMAIN TYPES (MATCH BACKEND CONTRACT)
============================================================ */

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

/* ============================================================
   SAFE RESPONSE EXTRACTOR
============================================================ */

function extractArray<T>(res: unknown): T[] {
  if (!res || typeof res !== "object") return [];

  const data = (res as { data?: unknown }).data;

  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const maybeArray = Object.values(data).find(Array.isArray);
    if (maybeArray) return maybeArray as T[];
  }

  return [];
}

/* ============================================================
   ANALYTICS HOOK (REAL DATA)
============================================================ */

export function useAnalytics(month: number, year: number) {
  const [loading, setLoading] = useState<boolean>(true);

  const [utilization, setUtilization] = useState<UtilizationRow[]>([]);
  const [bench, setBench] = useState<BenchEmployee[]>([]);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([]);
  const [suggestions, setSuggestions] = useState<MoveSuggestion[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      setLoading(true);

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

        if (!mounted) return;

        setUtilization(extractArray<UtilizationRow>(utilRes));
        setBench(extractArray<BenchEmployee>(benchRes));
        setRevenue(extractArray<RevenueRow>(revRes));
        setProjectHealth(extractArray<ProjectHealth>(healthRes));
        setSuggestions(extractArray<MoveSuggestion>(suggestRes));
      } catch (error) {
        console.error("Analytics load failed:", error);

        if (!mounted) return;

        setUtilization([]);
        setBench([]);
        setRevenue([]);
        setProjectHealth([]);
        setSuggestions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [month, year]);

  return {
    loading,
    utilization,
    bench,
    revenue,
    projectHealth,
    suggestions,
  };
}
