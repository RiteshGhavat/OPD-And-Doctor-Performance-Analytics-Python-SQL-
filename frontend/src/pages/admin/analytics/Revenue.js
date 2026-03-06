import { useEffect, useState } from "react";
import API from "../../../api";
import AdminLayout from "../../../components/AdminLayout";
import {
  Card, CardContent, Typography, Grid, Box,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  Chip, CircularProgress,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

const COLORS    = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
const fmt       = v => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;
const fmtPct    = v => `${Number(v || 0).toFixed(1)}%`;

const plRows = [
  { key: "gross_revenue",      label: "Gross Revenue",       color: "#3b82f6", bold: false },
  { key: "discounts",          label: "− Discounts",         color: "#ef4444", bold: false },
  { key: "net_revenue",        label: "= Net Revenue",       color: "#0f172a", bold: true  },
  { key: "cogs",               label: "− COGS (30%)",        color: "#f59e0b", bold: false },
  { key: "gross_profit",       label: "= Gross Profit",      color: "#10b981", bold: true  },
  { key: "operating_expenses", label: "− Operating Exp (20%)",color: "#f59e0b",bold: false },
  { key: "operating_profit",   label: "= Operating Profit",  color: "#8b5cf6", bold: true  },
  { key: "tax",                label: "− Tax (25%)",         color: "#ef4444", bold: false },
  { key: "net_profit",         label: "= Net Profit",        color: "#22c55e", bold: true  },
];

export default function RevenueAnalytics() {
  const [monthly,  setMonthly]  = useState([]);
  const [ticket,   setTicket]   = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [doctor,   setDoctor]   = useState({ data: [], total: 0, page: 0, rows: 5 });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/admin/analytics/revenue/monthly-branch"),
      API.get("/admin/analytics/revenue/avg-ticket"),
      API.get("/admin/analytics/revenue/financial-summary"),
    ]).then(([m, t, s]) => {
      setMonthly(m.data.data);
      setTicket(t.data.data);
      setSummary(s.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    API.get("/admin/analytics/revenue/doctor-contribution", {
      params: { page: doctor.page + 1, limit: doctor.rows },
    }).then(res => setDoctor(prev => ({ ...prev, data: res.data.data, total: res.data.total })));
  }, [doctor.page, doctor.rows]);

  if (loading) return (
    <AdminLayout>
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <Typography variant="h5" fontWeight={700} gutterBottom>Revenue Analytics</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Full P&L breakdown — gross revenue, COGS, operating expenses, tax, and net profit
      </Typography>

      {/* ── P&L SUMMARY CARDS ── */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: "Gross Revenue",    value: summary.gross_revenue,    icon: "💰", color: "#3b82f6" },
            { label: "Net Revenue",      value: summary.net_revenue,      icon: "📊", color: "#0f172a" },
            { label: "Gross Profit",     value: summary.gross_profit,     icon: "📈", color: "#10b981" },
            { label: "Operating Profit", value: summary.operating_profit, icon: "⚙️", color: "#8b5cf6" },
            { label: "Tax (25%)",        value: summary.tax,              icon: "🏛️", color: "#f59e0b" },
            { label: "Net Profit",       value: summary.net_profit,       icon: "✅", color: "#22c55e" },
            { label: "Outstanding",      value: summary.outstanding,      icon: "⏳", color: "#ef4444" },
            { label: "Total Bills",      value: summary.total_bills,      icon: "🧾", color: "#64748b", isCount: true },
          ].map((c, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
                <CardContent sx={{ p: "14px !important" }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box sx={{ fontSize: 18 }}>{c.icon}</Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}
                      sx={{ textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1.2 }}>
                      {c.label}
                    </Typography>
                  </Box>
                  <Typography fontWeight={700} sx={{ color: c.color, fontSize: { xs: 14, sm: 16 }, fontFamily: "DM Mono, monospace" }}>
                    {c.isCount ? summary.total_bills?.toLocaleString() : fmt(c.value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── P&L STATEMENT ── */}
      {summary && (
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Typography variant="h6" fontWeight={600}>P&L Statement</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip size="small" label={`Gross Margin: ${fmtPct(summary.gross_profit_pct)}`}  color="success" />
                <Chip size="small" label={`Net Margin: ${fmtPct(summary.net_profit_pct)}`}      color="primary" />
              </Box>
            </Box>

            <div style={{ overflowX: "auto" }}>
              <Table size="small">
                <TableBody>
                  {plRows.map(({ key, label, color, bold }) => (
                    <TableRow key={key} sx={{ background: bold ? "#f8fafc" : "transparent" }}>
                      <TableCell sx={{ fontWeight: bold ? 700 : 400, color: "#0f172a", py: 1 }}>
                        {label}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: bold ? 700 : 500, color, py: 1, fontFamily: "DM Mono, monospace" }}>
                        {fmt(summary[key])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MONTHLY CHART ── */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={3}>Monthly Revenue Trend</Typography>
          <Box sx={{ width: "100%", height: { xs: 240, sm: 300, md: 340 } }}>
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={55}
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v, name) => [fmt(v), name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="gross_revenue"  name="Gross Revenue"  fill="#3b82f6" radius={[6,6,0,0]} maxBarSize={35} />
                <Bar dataKey="net_revenue"    name="Net Revenue"    fill="#10b981" radius={[6,6,0,0]} maxBarSize={35} />
                <Bar dataKey="net_profit"     name="Net Profit"     fill="#22c55e" radius={[6,6,0,0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* ── PAYMENT MODE ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Revenue by Payment Mode</Typography>
              <Box sx={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={ticket} dataKey="total" nameKey="payment_mode"
                      innerRadius={60} outerRadius={95} paddingAngle={3}>
                      {ticket.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="caption" color="text.secondary">Total Billed</Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                {fmt(ticket.reduce((s, r) => s + Number(r.total || 0), 0))}
              </Typography>
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
                      <TableCell align="right"><b>Bills</b></TableCell>
                      <TableCell align="right"><b>Avg Ticket</b></TableCell>
                      <TableCell align="right"><b>Total</b></TableCell>
                      <TableCell align="right"><b>Discounts</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ticket.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.payment_mode}</TableCell>
                        <TableCell align="right">{r.bill_count?.toLocaleString()}</TableCell>
                        <TableCell align="right">{fmt(r.avg_ticket)}</TableCell>
                        <TableCell align="right">{fmt(r.total)}</TableCell>
                        <TableCell align="right" sx={{ color: "#ef4444" }}>{fmt(r.total_discounts)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── DOCTOR CONTRIBUTION ── */}
      <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>Revenue Contribution per Doctor</Typography>
          <div style={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  <TableCell><b>Doctor</b></TableCell>
                  <TableCell><b>Specialization</b></TableCell>
                  <TableCell align="right"><b>Visits</b></TableCell>
                  <TableCell align="right"><b>Gross</b></TableCell>
                  <TableCell align="right"><b>Net Revenue</b></TableCell>
                  <TableCell align="right"><b>Net Profit</b></TableCell>
                  <TableCell align="right"><b>Margin</b></TableCell>
                  <TableCell align="right"><b>Rev/Visit</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctor.data.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.doctor_name}</TableCell>
                    <TableCell>
                      <Chip label={r.specialization || "—"} size="small"
                        sx={{ fontSize: 11, height: 22, background: "#f1f5f9" }} />
                    </TableCell>
                    <TableCell align="right">{r.visits}</TableCell>
                    <TableCell align="right">{fmt(r.gross_revenue)}</TableCell>
                    <TableCell align="right">{fmt(r.net_revenue)}</TableCell>
                    <TableCell align="right" sx={{ color: "#22c55e", fontWeight: 600 }}>
                      {fmt(r.net_profit)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={fmtPct(r.net_profit_pct)}
                        size="small"
                        sx={{
                          fontSize: 11, height: 22, fontWeight: 600,
                          background: r.net_profit_pct >= 20 ? "#dcfce7" : r.net_profit_pct >= 10 ? "#fef9c3" : "#fee2e2",
                          color:      r.net_profit_pct >= 20 ? "#15803d"  : r.net_profit_pct >= 10 ? "#854d0e"  : "#b91c1c",
                        }}
                      />
                    </TableCell>
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