import { Routes, Route, Navigate } from "react-router-dom";
import RoleRoute from "../auth/RoleRoute";

/* Pages */
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import Dashboard from "./pages/Dashboard";
import Segmentations from "./pages/Segmentations";
import Skills from "./pages/Skills";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Equivalents from "./pages/Equivalent";
import ResourceAllocation from "./pages/ResourceAllocation";
// import Timesheets from "./pages/Timesheets";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import AIInsights from "./pages/AIInsights";
import UserManagement from "./pages/UserManagement";
import MyProfile from "./pages/MyProfile";

/* Resource Modules */
import EmployeesPage from "./pages/EmployeePage";
import { PortfolioDashboard } from "./pages/PortfolioDashboard";
import HeatmapScheduler from "./pages/HeatmapScheduler";
import { WorkloadManager } from "./pages/WorkloadManager";

/* Layouts */
import Layout from "./components/Layout";
import ResourcesLayout from "./components/ResourcesLayout";

export default function App() {
  return (
    <Routes>

      {/* ================= PUBLIC ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/set-password/:token" element={<SetPassword />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ================= PROTECTED ================= */}
      <Route
        element={
          <RoleRoute allowedRoles={["Admin", "Finance", "Employee"]} />
        }
      >
        <Route element={<Layout />}>

          {/* ===== DASHBOARD ===== */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ===== PROFILE ===== */}
          <Route path="/my-profile" element={<MyProfile />} />

          {/* ===== MASTER DATA ===== */}
          <Route path="/segmentations" element={<Segmentations />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/equivalent" element={<Equivalents />} />

          {/* ===== OPERATIONS ===== */}
          <Route path="/resource-allocation" element={<ResourceAllocation />} />
          {/* <Route path="/timesheets" element={<Timesheets />} /> */}
          <Route path="/billing" element={<Billing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai-insights" element={<AIInsights />} />

          {/* ===== USER MANAGEMENT (ADMIN ONLY) ===== */}
          <Route element={<RoleRoute allowedRoles={["Admin"]} />}>
            <Route path="/user-management" element={<UserManagement />} />
          </Route>


          {/* ===== RESOURCES MODULE ===== */}
          <Route path="/resources" element={<ResourcesLayout />}>
            <Route index element={<Navigate to="portfolio" replace />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="portfolio" element={<PortfolioDashboard />} />
            <Route path="heatmap" element={<HeatmapScheduler />} />
            <Route path="workload" element={<WorkloadManager />} />
          </Route>

        </Route>
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}