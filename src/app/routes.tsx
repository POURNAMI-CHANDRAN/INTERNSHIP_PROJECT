import { createBrowserRouter, redirect } from "react-router-dom";

/* AUTH */
import Login from "./pages/Login";

/* LAYOUT */
import Layout from "./components/Layout";

/* CORE PAGES */
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Resources";
import EmployeeProfile from "./pages/EmployeeProfile";
import Segmentations from "./pages/Segmentations";
import Skills from "./pages/Skills";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Equivalent from "./pages/Equivalent";
import ResourceAllocation from "./pages/ResourceAllocation";
import Timesheets from "./pages/Timesheets";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import AIInsights from "./pages/AIInsights";
import UserManagement from "./pages/UserManagement";

/* RESOURCE PLANNING */
import { PortfolioDashboard } from "./pages/PortfolioDashboard";
import HeatmapScheduler from "./pages/HeatmapScheduler";
import { WorkloadManager } from "./pages/WorkloadManager";

export const router = createBrowserRouter([
  /* LOGIN */
  {
    path: "/login",
    element: <Login />,
  },

  /* APP LAYOUT */
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        loader: () => redirect("/dashboard"),
      },

      /* CORE SYSTEM */
      { path: "dashboard", element: <Dashboard /> },
      { path: "employees", element: <Employees /> },
      { path: "employees/:id", element: <EmployeeProfile /> },
      { path: "segmentations", element: <Segmentations /> },
      { path: "skills", element: <Skills /> },
      { path: "clients", element: <Clients /> },
      { path: "projects", element: <Projects /> },
      { path: "Equivalent", element: <Equivalent /> },
      { path: "resource-allocation", element: <ResourceAllocation /> },
      { path: "timesheets", element: <Timesheets /> },
      { path: "billing", element: <Billing /> },
      { path: "reports", element: <Reports /> },
      { path: "ai-insights", element: <AIInsights /> },
      { path: "user-management", element: <UserManagement /> },

      /* RESOURCE PLANNING */
      { path: "portfolio", element: <PortfolioDashboard /> },
      { path: "heatmap", element: <HeatmapScheduler /> },
      { path: "workload", element: <WorkloadManager /> },
    ],
  },
]);