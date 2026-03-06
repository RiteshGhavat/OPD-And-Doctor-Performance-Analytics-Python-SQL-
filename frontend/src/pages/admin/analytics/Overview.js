import { useEffect, useState } from "react";
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
} from "@mui/material";

export default function Overview() {
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [newFollowup, setNewFollowup] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [ticketSize, setTicketSize] = useState([]);

  const [visitsPage, setVisitsPage] = useState(0);
  const [revenuePage, setRevenuePage] = useState(0);
  const [ticketPage, setTicketPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    API.get("/branch").then((res) => setBranches(res.data));
  }, []);

  useEffect(() => {
    const params = branch ? { branch_id: branch } : {};
    Promise.all([
      API.get("/admin/analytics/overview/new-vs-followup", { params }),
      API.get("/admin/analytics/overview/monthly-revenue", { params }),
      API.get("/admin/analytics/overview/avg-ticket-size", { params }),
    ]).then(([nvf, rev, avg]) => {
      setNewFollowup(nvf.data.data || []);
      setRevenue(rev.data.data || []);
      setTicketSize(avg.data.data || []);
    });
  }, [branch]);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setVisitsPage(0);
    setRevenuePage(0);
    setTicketPage(0);
  };

  const totalNew = newFollowup.reduce((s, r) => s + r.new_visits, 0);
  const totalFollowup = newFollowup.reduce((s, r) => s + r.followup_visits, 0);
  const grossRevenue = revenue.reduce((s, r) => s + r.gross_revenue, 0);
  const netRevenue = revenue.reduce((s, r) => s + r.net_revenue, 0);

  const summaryCards = [
    { label: "New Visits", value: totalNew, icon: "🆕", color: "#3b82f6" },
    {
      label: "Follow-up Visits",
      value: totalFollowup,
      icon: "🔁",
      color: "#10b981",
    },
    {
      label: "Gross Revenue",
      value: `₹ ${grossRevenue.toLocaleString()}`,
      icon: "💰",
      color: "#f59e0b",
    },
    {
      label: "Net Revenue",
      value: `₹ ${netRevenue.toLocaleString()}`,
      icon: "📊",
      color: "#8b5cf6",
    },
  ];

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        Analytics Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Branch-wise monthly visit and revenue summary
      </Typography>

      <TextField
        select
        size="small"
        label="Filter by Branch"
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        sx={{ mb: 3, width: 250 }}
      >
        <MenuItem value="">All Branches</MenuItem>
        {branches.map((b) => (
          <MenuItem key={b.branch_id} value={b.branch_id}>
            {b.branch_name}
          </MenuItem>
        ))}
      </TextField>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((item, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 1,
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${item.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    {item.icon}
                  </div>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    {item.label}
                  </Typography>
                </div>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: item.color, fontFamily: "DM Mono, monospace" }}
                >
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
            Monthly Visits
          </Typography>
          <div style={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  <TableCell>
                    <b>Month</b>
                  </TableCell>
                  <TableCell>
                    <b>Branch</b>
                  </TableCell>
                  <TableCell>
                    <b>New</b>
                  </TableCell>
                  <TableCell>
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
                      <TableCell>{r.new_visits}</TableCell>
                      <TableCell>{r.followup_visits}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            component="div"
            count={newFollowup.length}
            page={visitsPage}
            onPageChange={(e, p) => setVisitsPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

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
            Monthly Revenue
          </Typography>
          <div style={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  <TableCell>
                    <b>Month</b>
                  </TableCell>
                  <TableCell>
                    <b>Branch</b>
                  </TableCell>
                  <TableCell>
                    <b>Gross</b>
                  </TableCell>
                  <TableCell>
                    <b>Net</b>
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
                      <TableCell>
                        ₹ {r.gross_revenue?.toLocaleString()}
                      </TableCell>
                      <TableCell>₹ {r.net_revenue?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            component="div"
            count={revenue.length}
            page={revenuePage}
            onPageChange={(e, p) => setRevenuePage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Avg Ticket Size
          </Typography>
          <div style={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  <TableCell>
                    <b>Payment Mode</b>
                  </TableCell>
                  <TableCell>
                    <b>Avg Ticket</b>
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
                      <TableCell>₹ {r.avg_ticket?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            component="div"
            count={ticketSize.length}
            page={ticketPage}
            onPageChange={(e, p) => setTicketPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
