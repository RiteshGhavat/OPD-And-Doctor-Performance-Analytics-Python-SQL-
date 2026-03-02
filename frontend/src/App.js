import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ================= PUBLIC PAGES =================
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
// ================= USER PAGES =================
import UserDashboard from "./pages/user/UserDashboard";

// ================= ADMIN PAGES =================
import Dashboard from "./pages/admin/Dashboard";
import BranchManagement from "./pages/admin/BranchManagement";
import Users from "./pages/admin/Users";
import Doctor from "./pages/admin/Doctor";

// ================= ANALYTICS PAGES =================
import Overview from "./pages/admin/analytics/Overview";
import Doctors from "./pages/admin/analytics/Doctors";
import Revenue from "./pages/admin/analytics/Revenue";
import PeakHours from "./pages/admin/analytics/PeakHours";

// ================= COMPONENTS =================
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* ================= LANDING PAGE ================= */}
        <Route path="/" element={<Index />} />

        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= USER PROTECTED ROUTES ================= */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute roleRequired="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN PROTECTED ROUTES ================= */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roleRequired="Admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roleRequired="Admin">
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/doctors"
          element={
            <ProtectedRoute roleRequired="Admin">
              <Doctor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute roleRequired="Admin">
              <BranchManagement />
            </ProtectedRoute>
          }
        />

        {/* ================= ANALYTICS PROTECTED ROUTES ================= */}

        <Route
          path="/admin/analytics/overview"
          element={
            <ProtectedRoute roleRequired="Admin">
              <Overview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics/doctors"
          element={
            <ProtectedRoute roleRequired="Admin">
              <Doctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics/revenue"
          element={
            <ProtectedRoute roleRequired="Admin">
              <Revenue />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics/peak-hours"
          element={
            <ProtectedRoute roleRequired="Admin">
              <PeakHours />
            </ProtectedRoute>
          }
        />

        {/* ================= 404 PAGE ================= */}
        <Route
          path="*"
          element={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                fontSize: "24px",
                fontWeight: "600",
              }}
            >
              404 - Page Not Found
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
