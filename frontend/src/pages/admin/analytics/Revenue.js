import { useEffect, useState } from "react";
import API from "../../../api";
import AdminLayout from "../../../components/AdminLayout";
import {
  Card, CardContent, Typography, Grid, Box,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
const fmt    = v => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

export default function RevenueAnalytics() {
  const [monthly, setMonthly] = useState([]);
  const [ticket,  setTicket]  = useState([]);
  const [doctor,  setDoctor]  = useState({ data: [], total: 0, page: 0, rows: 5 });

  useEffect(() => {
    API.get("/admin/analytics/revenue/monthly-branch").then(res => setMonthly(res.data.data));
    API.get("/admin/analytics/revenue/avg-ticket").then(res => setTicket(res.data.data));
  }, []);

  useEffect(() => {
    API.get("/admin/analytics/revenue/doctor-contribution", {
      params: { page: doctor.page + 1, limit: doctor.rows },
    }).then(res => setDoctor(prev => ({ ...prev, data: res.data.data, total: res.data.total })));
  }, [doctor.page, doctor.rows]);

  const totalRevenue = ticket.reduce((sum, r) => sum + Number(r.total || 0), 0);

  return (
    <AdminLayout>
      <Typography variant="h5" fontWeight={700} gutterBottom>Revenue Analytics</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Financial performance overview by branch, payment mode, and doctors
      </Typography>

      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={3}>Monthly Revenue per Branch</Typography>
          <Box sx={{ width: "100%", height: { xs: 260, sm: 320, md: 340 } }}>
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }} width={55}
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`}
                />
                <Tooltip formatter={v => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="gross" name="Gross Revenue" fill="#3b82f6" radius={[6,6,0,0]} maxBarSize={40} />
                <Bar dataKey="net"   name="Net Revenue"   fill="#10b981" radius={[6,6,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Avg Ticket by Payment Mode</Typography>
              <Box sx={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={ticket} dataKey="total" nameKey="payment_mode"
                      innerRadius={65} outerRadius={100} paddingAngle={3}>
                      {ticket.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">{fmt(totalRevenue)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Billing Summary</Typography>
              <div style={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f8fafc" }}>
                      <TableCell><b>Payment Mode</b></TableCell>
                      <TableCell align="right"><b>Avg Ticket</b></TableCell>
                      <TableCell align="right"><b>Total Revenue</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ticket.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.payment_mode}</TableCell>
                        <TableCell align="right">{fmt(r.avg_ticket)}</TableCell>
                        <TableCell align="right">{fmt(r.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>Revenue Contribution per Doctor</Typography>
          <div style={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  <TableCell><b>Doctor</b></TableCell>
                  <TableCell align="right"><b>Visits</b></TableCell>
                  <TableCell align="right"><b>Total Revenue</b></TableCell>
                  <TableCell align="right"><b>Revenue / Visit</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctor.data.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.doctor_name}</TableCell>
                    <TableCell align="right">{r.visits}</TableCell>
                    <TableCell align="right">{fmt(r.revenue)}</TableCell>
                    <TableCell align="right">{fmt(r.revenue_per_visit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            component="div"
            count={doctor.total}
            page={doctor.page}
            rowsPerPage={doctor.rows}
            rowsPerPageOptions={[5, 10, 25]}
            onPageChange={(e, p) => setDoctor(prev => ({ ...prev, page: p }))}
            onRowsPerPageChange={e => setDoctor(prev => ({ ...prev, rows: +e.target.value, page: 0 }))}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}