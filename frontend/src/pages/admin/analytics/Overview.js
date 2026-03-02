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

  // ================= PAGINATION STATES =================
  const [visitsPage, setVisitsPage] = useState(0);
  const [revenuePage, setRevenuePage] = useState(0);
  const [ticketPage, setTicketPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(5);

  // ================= LOAD BRANCHES =================
  useEffect(() => {
    API.get("/branch").then((res) => setBranches(res.data));
  }, []);

  // ================= LOAD DATA =================
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

  // ================= ROWS PER PAGE HANDLER =================
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setVisitsPage(0);
    setRevenuePage(0);
    setTicketPage(0);
  };

  // ================= CALCULATIONS =================
  const totalNew = newFollowup.reduce((s, r) => s + r.new_visits, 0);
  const totalFollowup = newFollowup.reduce((s, r) => s + r.followup_visits, 0);
  const grossRevenue = revenue.reduce((s, r) => s + r.gross_revenue, 0);
  const netRevenue = revenue.reduce((s, r) => s + r.net_revenue, 0);

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Analytics Overview
      </Typography>

      {/* ================= BRANCH FILTER ================= */}
      <TextField
        select
        size="small"
        label="Branch"
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

      {/* ================= SUMMARY CARDS ================= */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "New Visits", value: totalNew },
          { label: "Follow-up Visits", value: totalFollowup },
          { label: "Gross Revenue", value: `₹ ${grossRevenue.toLocaleString()}` },
          { label: "Net Revenue", value: `₹ ${netRevenue.toLocaleString()}` },
        ].map((item, i) => (
          <Grid item xs={12} md={3} key={i}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h6">{item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ================= MONTHLY VISITS ================= */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Monthly Visits</Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>New</TableCell>
                <TableCell>Follow-up</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {newFollowup
                .slice(
                  visitsPage * rowsPerPage,
                  visitsPage * rowsPerPage + rowsPerPage
                )
                .map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell>{r.branch_name}</TableCell>
                    <TableCell>{r.new_visits}</TableCell>
                    <TableCell>{r.followup_visits}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

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

      {/* ================= MONTHLY REVENUE ================= */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Monthly Revenue</Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Gross</TableCell>
                <TableCell>Net</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {revenue
                .slice(
                  revenuePage * rowsPerPage,
                  revenuePage * rowsPerPage + rowsPerPage
                )
                .map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell>{r.branch_name}</TableCell>
                    <TableCell>₹ {r.gross_revenue}</TableCell>
                    <TableCell>₹ {r.net_revenue}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

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

      {/* ================= AVG TICKET SIZE ================= */}
      <Card>
        <CardContent>
          <Typography variant="h6">Avg Ticket Size</Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Payment Mode</TableCell>
                <TableCell>Avg Ticket</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ticketSize
                .slice(
                  ticketPage * rowsPerPage,
                  ticketPage * rowsPerPage + rowsPerPage
                )
                .map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.payment_mode}</TableCell>
                    <TableCell>₹ {r.avg_ticket.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

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