import { useEffect, useState, useCallback } from "react";
import API from "../../../api";
import AdminLayout from "../../../components/AdminLayout";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Skeleton,
  Chip,
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const fmt = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;
const fmtNum = (v) => Number(v || 0).toLocaleString("en-IN");

// ── Reusable skeleton for stat cards ──────────────────────────────────────────
function StatCard({ icon, label, value, color, loading }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 1,
        border: "1px solid #e2e8f0",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: "14px !important" }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `${color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{
              textTransform: "uppercase",
              letterSpacing: 0.4,
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
        </Box>
        {loading ? (
          <Skeleton width="65%" height={30} />
        ) : (
          <Typography
            fontWeight={700}
            sx={{
              color,
              fontSize: { xs: 14, sm: 17 },
              fontFamily: "DM Mono, monospace",
            }}
          >
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── Reusable skeleton for tables ──────────────────────────────────────────────
function TableSkeleton({ cols = 4, rows = 5 }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ background: "#f8fafc" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <TableCell key={i}>
              <Skeleton width={70} height={18} />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton height={16} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Chart skeleton ─────────────────────────────────────────────────────────────
function ChartSkeleton({ height = 240 }) {
  return (
    <Skeleton
      variant="rectangular"
      height={height}
      sx={{ borderRadius: 2, mt: 1 }}
    />
  );
}

export default function Overview() {
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [newFollowup, setNewFollowup] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [ticketSize, setTicketSize] = useState([]);

  const [loadingInit, setLoadingInit] = useState(true); // first load
  const [loadingData, setLoadingData] = useState(true); // filter change

  const [visitsPage, setVisitsPage] = useState(0);
  const [revenuePage, setRevenuePage] = useState(0);
  const [ticketPage, setTicketPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // ── Load branches once ────────────────────────────────────────────────────
  useEffect(() => {
    API.get("/branch")
      .then((res) => setBranches(res.data))
      .finally(() => setLoadingInit(false));
  }, []);

  // ── Single API call: /overview/all replaces 3 separate calls ─────────────
  const loadData = useCallback(() => {
    setLoadingData(true);
    const params = branch ? { branch_id: branch } : {};

    API.get("/admin/analytics/overview/all", { params })
      .then((res) => {
        setNewFollowup(res.data.new_followup || []);
        setRevenue(res.data.revenue || []);
        setTicketSize(res.data.ticket_size || []);
        setVisitsPage(0);
        setRevenuePage(0);
        setTicketPage(0);
      })
      .finally(() => setLoadingData(false));
  }, [branch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setVisitsPage(0);
    setRevenuePage(0);
    setTicketPage(0);
  };

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalNew = newFollowup.reduce((s, r) => s + (r.new_visits || 0), 0);
  const totalFollowup = newFollowup.reduce(
    (s, r) => s + (r.followup_visits || 0),
    0,
  );
  const totalVisits = totalNew + totalFollowup;
  const followupPct = totalVisits
    ? Math.round((totalFollowup / totalVisits) * 100)
    : 0;
  const grossRevenue = revenue.reduce((s, r) => s + (r.gross_revenue || 0), 0);
  const netRevenue = revenue.reduce((s, r) => s + (r.net_revenue || 0), 0);
  const netProfit = revenue.reduce((s, r) => s + (r.net_profit || 0), 0);

  const summaryCards = [
    {
      label: "New Visits",
      value: fmtNum(totalNew),
      icon: "🆕",
      color: "#3b82f6",
    },
    {
      label: "Follow-up Visits",
      value: fmtNum(totalFollowup),
      icon: "🔁",
      color: "#10b981",
    },
    {
      label: "Gross Revenue",
      value: fmt(grossRevenue),
      icon: "💰",
      color: "#f59e0b",
    },
    {
      label: "Net Revenue",
      value: fmt(netRevenue),
      icon: "📊",
      color: "#8b5cf6",
    },
    {
      label: "Net Profit",
      value: fmt(netProfit),
      icon: "✅",
      color: "#22c55e",
    },
    {
      label: "Follow-up Rate",
      value: `${followupPct}%`,
      icon: "📈",
      color: "#0ea5e9",
    },
  ];

  // ── Aggregate chart data by month (across all branches) ───────────────────
  const revenueChart = Object.values(
    revenue.reduce((acc, r) => {
      if (!acc[r.month])
        acc[r.month] = { month: r.month, gross: 0, net: 0, profit: 0 };
      acc[r.month].gross += r.gross_revenue || 0;
      acc[r.month].net += r.net_revenue || 0;
      acc[r.month].profit += r.net_profit || 0;
      return acc;
    }, {}),
  );

  const visitChart = Object.values(
    newFollowup.reduce((acc, r) => {
      if (!acc[r.month]) acc[r.month] = { month: r.month, new: 0, followup: 0 };
      acc[r.month].new += r.new_visits || 0;
      acc[r.month].followup += r.followup_visits || 0;
      return acc;
    }, {}),
  );

  const isLoading = loadingInit || loadingData;

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        Analytics Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Branch-wise monthly visit and revenue summary
      </Typography>

      {/* ── FILTER ── */}
      <TextField
        select
        size="small"
        label="Filter by Branch"
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        disabled={loadingInit}
        sx={{ mb: 3, width: { xs: "100%", sm: 250 } }}
      >
        <MenuItem value="">All Branches</MenuItem>
        {branches.map((b) => (
          <MenuItem key={b.branch_id} value={b.branch_id}>
            {b.branch_name}
          </MenuItem>
        ))}
      </TextField>

      {/* ── SUMMARY CARDS ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((item, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <StatCard {...item} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      {/* ── REVENUE TREND LINE CHART ── */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: 1,
          border: "1px solid #e2e8f0",
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Monthly Revenue Trend
          </Typography>
          {isLoading ? (
            <ChartSkeleton height={240} />
          ) : (
            <Box sx={{ width: "100%", height: { xs: 220, sm: 260, md: 280 } }}>
              <ResponsiveContainer>
                <LineChart
                  data={revenueChart}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={55}
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : `${(v / 1000).toFixed(0)}K`
                    }
                  />
                  <Tooltip formatter={(v, name) => [fmt(v), name]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="gross"
                    name="Gross Revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Net Profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── NEW VS FOLLOWUP BAR CHART ── */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: 1,
          border: "1px solid #e2e8f0",
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            flexWrap="wrap"
            gap={1}
          >
            <Typography variant="h6" fontWeight={600}>
              New vs Follow-up Visits
            </Typography>
            {!isLoading && totalVisits > 0 && (
              <Chip
                size="small"
                color="primary"
                label={`Follow-up Rate: ${followupPct}%`}
              />
            )}
          </Box>
          {isLoading ? (
            <ChartSkeleton height={200} />
          ) : (
            <Box sx={{ width: "100%", height: { xs: 200, sm: 240 } }}>
              <ResponsiveContainer>
                <BarChart
                  data={visitChart}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={40}
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="new"
                    name="New"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="followup"
                    name="Follow-up"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── MONTHLY VISITS TABLE ── */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: 1,
          border: "1px solid #e2e8f0",
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Monthly Visits — Detail
          </Typography>
          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <TableSkeleton cols={4} rows={5} />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    <TableCell>
                      <b>Month</b>
                    </TableCell>
                    <TableCell>
                      <b>Branch</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>New</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Follow-up</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newFollowup
                    .slice(
                      visitsPage * rowsPerPage,
                      visitsPage * rowsPerPage + rowsPerPage,
                    )
                    .map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.month}</TableCell>
                        <TableCell>{r.branch_name}</TableCell>
                        <TableCell align="right">
                          {fmtNum(r.new_visits)}
                        </TableCell>
                        <TableCell align="right">
                          {fmtNum(r.followup_visits)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
          {!isLoading && (
            <TablePagination
              component="div"
              count={newFollowup.length}
              page={visitsPage}
              onPageChange={(e, p) => setVisitsPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </CardContent>
      </Card>

      {/* ── MONTHLY REVENUE TABLE ── */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: 1,
          border: "1px solid #e2e8f0",
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Monthly Revenue — Detail
          </Typography>
          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <TableSkeleton cols={5} rows={5} />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    <TableCell>
                      <b>Month</b>
                    </TableCell>
                    <TableCell>
                      <b>Branch</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Gross</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Net Revenue</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Net Profit</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenue
                    .slice(
                      revenuePage * rowsPerPage,
                      revenuePage * rowsPerPage + rowsPerPage,
                    )
                    .map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.month}</TableCell>
                        <TableCell>{r.branch_name}</TableCell>
                        <TableCell align="right">
                          {fmt(r.gross_revenue)}
                        </TableCell>
                        <TableCell align="right">
                          {fmt(r.net_revenue)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: "#22c55e", fontWeight: 600 }}
                        >
                          {fmt(r.net_profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
          {!isLoading && (
            <TablePagination
              component="div"
              count={revenue.length}
              page={revenuePage}
              onPageChange={(e, p) => setRevenuePage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </CardContent>
      </Card>

      {/* ── AVG TICKET TABLE ── */}
      <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Avg Ticket by Payment Mode
          </Typography>
          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <TableSkeleton cols={4} rows={4} />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    <TableCell>
                      <b>Payment Mode</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Bills</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Avg Ticket</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Discounts</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ticketSize
                    .slice(
                      ticketPage * rowsPerPage,
                      ticketPage * rowsPerPage + rowsPerPage,
                    )
                    .map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{r.payment_mode}</TableCell>
                        <TableCell align="right">{fmtNum(r.count)}</TableCell>
                        <TableCell align="right">{fmt(r.avg_ticket)}</TableCell>
                        <TableCell align="right" sx={{ color: "#ef4444" }}>
                          {fmt(r.total_discounts)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
          {!isLoading && (
            <TablePagination
              component="div"
              count={ticketSize.length}
              page={ticketPage}
              onPageChange={(e, p) => setTicketPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
