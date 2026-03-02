import { useEffect, useState } from "react";
import API from "../../../api";
import AdminLayout from "../../../components/AdminLayout";

import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  Box,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#1976d2", "#2e7d32", "#ed6c02", "#9c27b0"];

const formatCurrency = (value) =>
  `₹ ${Number(value || 0).toLocaleString("en-IN")}`;

export default function RevenueAnalytics() {
  const [monthly, setMonthly] = useState([]);
  const [ticket, setTicket] = useState([]);
  const [doctor, setDoctor] = useState({
    data: [],
    total: 0,
    page: 0,
    rows: 5,
  });

  /* ================= API CALLS ================= */

  useEffect(() => {
    API.get("/admin/analytics/revenue/monthly-branch").then((res) =>
      setMonthly(res.data.data)
    );

    API.get("/admin/analytics/revenue/avg-ticket").then((res) =>
      setTicket(res.data.data)
    );
  }, []);

  useEffect(() => {
    API.get("/admin/analytics/revenue/doctor-contribution", {
      params: { page: doctor.page + 1, limit: doctor.rows },
    }).then((res) =>
      setDoctor((prev) => ({
        ...prev,
        data: res.data.data,
        total: res.data.total,
      }))
    );
  }, [doctor.page, doctor.rows]);

  const totalRevenue = ticket.reduce((sum, r) => sum + Number(r.total || 0), 0);

  return (
    <AdminLayout>
      {/* ================= HEADER ================= */}
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Revenue Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Financial performance overview by branch, payment mode, and doctors
      </Typography>

      {/* ================= MONTHLY REVENUE ================= */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Monthly Revenue per Branch
          </Typography>

          <Box sx={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart
                data={monthly}
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    value >= 1000000
                      ? `${(value / 1000000).toFixed(1)}M`
                      : `${(value / 1000).toFixed(0)}K`
                  }
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar
                  dataKey="gross"
                  name="Gross Revenue"
                  fill="#1976d2"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey="net"
                  name="Net Revenue"
                  fill="#2e7d32"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* ================= PAYMENT + BILLING ================= */}
      <Grid container spacing={3}>
        {/* ===== PIE CHART ===== */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Avg Ticket by Payment Mode
              </Typography>

              <Box sx={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={ticket}
                      dataKey="total"
                      nameKey="payment_mode"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {ticket.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* TOTAL CENTER VALUE */}
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mt: 0.5 }}
                >
                  {formatCurrency(totalRevenue)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ===== BILLING SUMMARY TABLE ===== */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Billing Summary
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><b>Payment Mode</b></TableCell>
                    <TableCell align="right"><b>Avg Ticket</b></TableCell>
                    <TableCell align="right"><b>Total Revenue</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ticket.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.payment_mode}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(r.avg_ticket)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(r.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================= DOCTOR CONTRIBUTION ================= */}
      <Card sx={{ mt: 4, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Revenue Contribution per Doctor
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Doctor</b></TableCell>
                <TableCell align="right"><b>Visits</b></TableCell>
                <TableCell align="right"><b>Total Revenue</b></TableCell>
                <TableCell align="right"><b>Revenue / Visit</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doctor.data.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.doctor_name}</TableCell>
                  <TableCell align="right">{r.visits}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(r.revenue)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(r.revenue_per_visit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={doctor.total}
            page={doctor.page}
            rowsPerPage={doctor.rows}
            rowsPerPageOptions={[5, 10, 25]}
            onPageChange={(e, p) =>
              setDoctor((prev) => ({ ...prev, page: p }))
            }
            onRowsPerPageChange={(e) =>
              setDoctor((prev) => ({
                ...prev,
                rows: parseInt(e.target.value, 10),
                page: 0,
              }))
            }
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}