import { useEffect, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/AdminLayout";
import { CircularProgress, Box, Typography } from "@mui/material";

const statCards = [
  { key: "branches", label: "Total Branches", icon: "🏢", color: "#3b82f6" },
  { key: "doctors", label: "Total Doctors", icon: "🩺", color: "#10b981" },
  { key: "users", label: "Total Users", icon: "👥", color: "#f59e0b" },
  { key: "visits", label: "Total Visits", icon: "📋", color: "#8b5cf6" },
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
        {statCards.map(({ key, label, icon, color }) => (
          <div className="card" key={key}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                {icon}
              </div>
            </div>
            <h4>{label}</h4>
            <h2 style={{ color }}>{data[key] ?? 0}</h2>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default Dashboard;
