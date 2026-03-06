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

const formatHour = (hour) => {
  const h = hour % 12 || 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
};

export default function PeakHours() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/admin/analytics/peak-hours/branches")
      .then((res) => setBranches(res.data.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    API.get("/admin/analytics/peak-hours", {
      params: branchId ? { branch_id: branchId } : {},
    })
      .then((res) => {
        const raw = res.data.data || [];
        const formatted = Array.from({ length: 24 }, (_, h) => {
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

  const peak = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((max, cur) => (cur.visits > max.visits ? cur : max));
  }, [data]);

  return (
    <AdminLayout>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Peak Hours Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Identify high-traffic hours to optimize staffing and OPD flow
      </Typography>

      <Grid container spacing={2} mb={3} alignItems="center">
        <Grid item xs={12} sm="auto">
          <FormControl sx={{ minWidth: 220 }} size="small">
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
          <Grid item>
            <Chip
              color="primary"
              label={`🔥 Peak: ${peak.label} — ${peak.visits} visits`}
            />
          </Grid>
        )}
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Hour-wise Patient Visits
          </Typography>
          <Box sx={{ width: "100%", height: { xs: 280, sm: 380, md: 420 } }}>
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
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="label"
                    angle={-40}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip formatter={(v) => [`${v} visits`, "Patients"]} />
                  <Bar dataKey="visits" radius={[6, 6, 0, 0]} maxBarSize={35}>
                    {data.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          peak && entry.hour === peak.hour
                            ? "#ef4444"
                            : "#3b82f6"
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
