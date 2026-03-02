import { useEffect, useMemo, useState } from "react";
import API from "../../../api";
import AdminLayout from "../../../components/AdminLayout";

import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Grid,
  Chip,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// ---------- Helpers ----------
const formatHour = (hour) => {
  const h = hour % 12 || 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h} ${suffix}`;
};

export default function PeakHours() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= FETCH BRANCHES =================
  useEffect(() => {
    API.get("/admin/analytics/peak-hours/branches")
      .then((res) => setBranches(res.data.data || []))
      .catch(console.error);
  }, []);

  // ================= FETCH PEAK HOURS =================
  useEffect(() => {
    setLoading(true);
    API.get("/admin/analytics/peak-hours", {
      params: branchId ? { branch_id: branchId } : {},
    })
      .then((res) => {
        const raw = res.data.data || [];

        const hours = Array.from({ length: 24 }, (_, i) => i);
        const formatted = hours.map((h) => {
          const found = raw.find((r) => r.hour === h);
          return {
            hour: h,
            label: formatHour(h),
            visits: found ? found.visits : 0,
          };
        });

        setData(formatted);
      })
      .finally(() => setLoading(false));
  }, [branchId]);

  // ================= PEAK HOUR =================
  const peak = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((max, cur) =>
      cur.visits > max.visits ? cur : max
    );
  }, [data]);

  return (
    <AdminLayout>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Peak Hours Analytics
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Identify high-traffic hours to optimize staffing and OPD flow
      </Typography>

      {/* ================= FILTER + SUMMARY ================= */}
      <Grid container spacing={2} mb={3}>
        <Grid item>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              value={branchId}
              label="Branch"
              onChange={(e) => setBranchId(e.target.value)}
            >
              <MenuItem value="">
                <em>All Branches</em>
              </MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {peak && peak.visits > 0 && (
          <Grid item alignSelf="center">
            <Chip
              color="primary"
              label={`Peak Hour: ${peak.label} (${peak.visits} visits)`}
            />
          </Grid>
        )}
      </Grid>

      {/* ================= CHART ================= */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Hour-wise Patient Visits
          </Typography>

          <Box sx={{ width: "100%", height: 420 }}>
            {loading ? (
              <Box
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    interval={1}
                    angle={-35}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [`${v} visits`, "Patients"]}
                  />
                  <Bar dataKey="visits" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          peak && entry.hour === peak.hour
                            ? "#d32f2f" // highlight peak
                            : "#1976d2"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>

          {!loading && data.every((d) => d.visits === 0) && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mt={2}
            >
              No visit data available for the selected branch.
            </Typography>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}