/* =====================================================
   AI COPILOT INTENT DETECTOR
===================================================== */
const clean = (text = "") =>
  String(text)
    .toLowerCase()
    .trim();

const containsAny = (
  text,
  keywords = []
) => {
  const source = clean(text);

  return keywords.some(word =>
    source.includes(
      clean(word)
    )
  );
};

/* =====================================================
   INTENT MAP
===================================================== */
export const detectIntent = (
  question = ""
) => {
  const q = clean(question);

  /* ===============================
     DASHBOARD / SUMMARY
  =============================== */
  if (
    containsAny(q, [
      "dashboard",
      "summary",
      "overview",
      "snapshot",
      "status report",
      "company status"
    ])
  ) {
    return "DASHBOARD";
  }

  /* ===============================
     BENCH
  =============================== */
  if (
    containsAny(q, [
      "bench",
      "idle employees",
      "idle staff",
      "free employees",
      "who is free",
      "available without project",
      "employees on bench"
    ])
  ) {
    return "BENCH";
  }

  /* ===============================
     UTILIZATION
  =============================== */
  if (
    containsAny(q, [
      "utilization",
      "underutilized",
      "overallocated",
      "overloaded",
      "low utilization",
      "resource usage",
      "billable percentage"
    ])
  ) {
    return "UTILIZATION";
  }

  /* ===============================
     PERFORMANCE
  =============================== */
  if (
    containsAny(q, [
      "top performers",
      "best employees",
      "highest margin",
      "most profitable staff",
      "performance ranking"
    ])
  ) {
    return "PERFORMANCE";
  }

  /* ===============================
     PROJECTS
  =============================== */
  if (
    containsAny(q, [
      "projects",
      "project revenue",
      "top projects",
      "project margin",
      "client projects"
    ])
  ) {
    return "PROJECTS";
  }

  /* ===============================
     EXECUTIVE
  =============================== */
  if (
    containsAny(q, [
      "executive summary",
      "management summary",
      "ceo report",
      "board report",
      "leadership summary"
    ])
  ) {
    return "EXECUTIVE";
  }

  /* ===============================
     FORECAST
  =============================== */
  if (
    containsAny(q, [
      "forecast",
      "prediction",
      "future outlook",
      "next month summary"
    ])
  ) {
    return "FORECAST";
  }

  /* ===============================
     REVENUE FORECAST
  =============================== */
  if (
    containsAny(q, [
      "revenue forecast",
      "future revenue",
      "predict revenue",
      "next month revenue"
    ])
  ) {
    return "REVENUE_FORECAST";
  }

  /* ===============================
     BENCH FORECAST
  =============================== */
  if (
    containsAny(q, [
      "bench forecast",
      "future bench",
      "bench next month",
      "idle forecast"
    ])
  ) {
    return "BENCH_FORECAST";
  }

  /* ===============================
     UTILIZATION FORECAST
  =============================== */
  if (
    containsAny(q, [
      "utilization forecast",
      "future utilization",
      "next month utilization"
    ])
  ) {
    return "UTIL_FORECAST";
  }

  /* ===============================
     HIRING
  =============================== */
  if (
    containsAny(q, [
      "hiring",
      "need to hire",
      "recruitment forecast",
      "how many hires",
      "staffing demand"
    ])
  ) {
    return "HIRING";
  }

  /* ===============================
     RESOURCE MATCHING
  =============================== */
  if (
    containsAny(q, [
      "allocate",
      "assign employee",
      "suggest resource",
      "find developer",
      "need react developer",
      "need java developer",
      "best resource"
    ])
  ) {
    return "ALLOCATE";
  }

  /* ===============================
     BENCH DEPLOYMENT
  =============================== */
  if (
    containsAny(q, [
      "deploy bench",
      "use idle staff",
      "move bench employees",
      "assign bench employees"
    ])
  ) {
    return "DEPLOY_BENCH";
  }

  /* ===============================
     LOAD BALANCING
  =============================== */
  if (
    containsAny(q, [
      "load balance",
      "reduce workload",
      "who is overloaded",
      "rebalance team"
    ])
  ) {
    return "LOAD_BALANCE";
  }

  /* ===============================
     FULL RECOMMENDATION
  =============================== */
  if (
    containsAny(q, [
      "recommend",
      "recommendation",
      "what should i do",
      "best next action",
      "smart suggestions"
    ])
  ) {
    return "RECOMMEND";
  }

  /* ===============================
     DEFAULT
  =============================== */
  return "LLM";
};