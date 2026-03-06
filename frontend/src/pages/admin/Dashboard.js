import { useEffect, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/AdminLayout";
import { CircularProgress, Box, Typography } from "@mui/material";

const statCards = [
  {
    key: "branches",
    label: "Total Branches",
    icon: "🏢",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    key: "doctors",
    label: "Total Doctors",
    icon: "🩺",
    color: "#10b981",
    bg: "#f0fdf4",
  },
  {
    key: "users",
    label: "Total Users",
    icon: "👥",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    key: "visits",
    label: "Total Visits",
    icon: "📋",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
];

function Dashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/dashboard/")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <AdminLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="60vh"
        >
          <CircularProgress />
        </Box>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Dashboard Overview
      </Typography>

      <div className="dashboard-grid">
        {statCards.map(({ key, label, icon, color, bg }) => (
          <div className="card stat-card" key={key}>
            {/* Icon box */}
            <div className="stat-icon-row">
              <div className="stat-icon" style={{ background: bg, color }}>
                {icon}
              </div>
            </div>

            {/* Label */}
            <div className="stat-label">{label}</div>

            {/* Value */}
            <div className="stat-value" style={{ color }}>
              {Number(data[key] ?? 0).toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default Dashboard;
