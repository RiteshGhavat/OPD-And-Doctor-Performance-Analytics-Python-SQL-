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
} from "@mui/material";

export default function DoctorsAnalytics() {
  const [opd, setOpd] = useState({ data: [], total: 0, page: 0, rows: 5 });
  const [perf, setPerf] = useState({ data: [], total: 0, page: 0, rows: 5 });
  const [diag, setDiag] = useState({ data: [], total: 0, page: 0, rows: 5 });

  const load = async (url, state, setter) => {
    try {
      const res = await API.get(url, {
        params: { page: state.page + 1, limit: state.rows },
      });
      setter((prev) => ({
        ...prev,
        data: res.data.data,
        total: res.data.total,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load("/admin/analytics/doctors/opd-load", opd, setOpd);
  }, [opd.page, opd.rows]);
  useEffect(() => {
    load("/admin/analytics/doctors/performance", perf, setPerf);
  }, [perf.page, perf.rows]);
  useEffect(() => {
    load("/admin/analytics/doctors/top-diagnoses", diag, setDiag);
  }, [diag.page, diag.rows]);

  const renderTable = (title, headers, rows, state, setState) => (
    <Card
      sx={{ mb: 3, borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={600} mb={2}>
          {title}
        </Typography>
        <div style={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: "#f8fafc" }}>
                {headers.map((h) => (
                  <TableCell key={h}>
                    <b>{h}</b>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </div>
        <TablePagination
          component="div"
          count={state.total}
          page={state.page}
          rowsPerPage={state.rows}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(e, p) => setState((prev) => ({ ...prev, page: p }))}
          onRowsPerPageChange={(e) =>
            setState((prev) => ({ ...prev, rows: +e.target.value, page: 0 }))
          }
        />
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        Doctor Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        OPD load, performance metrics, and diagnosis trends per doctor
      </Typography>

      {renderTable(
        "Doctor-wise OPD Load",
        ["Doctor", "Branch", "Month", "Visits"],
        opd.data.map((r, i) => (
          <TableRow key={i} hover>
            <TableCell>{r.doctor_name}</TableCell>
            <TableCell>{r.branch_name}</TableCell>
            <TableCell>{r.month}</TableCell>
            <TableCell>{r.visit_count}</TableCell>
          </TableRow>
        )),
        opd,
        setOpd,
      )}

      {renderTable(
        "Doctor Performance",
        ["Doctor", "Visits", "Revenue", "Avg Fee"],
        perf.data.map((r, i) => (
          <TableRow key={i} hover>
            <TableCell>{r.doctor_name}</TableCell>
            <TableCell>{r.total_visits}</TableCell>
            <TableCell>₹ {Number(r.total_revenue)?.toLocaleString()}</TableCell>
            <TableCell>₹ {Number(r.avg_fee)?.toLocaleString()}</TableCell>
          </TableRow>
        )),
        perf,
        setPerf,
      )}

      {renderTable(
        "Top Diagnoses per Specialization",
        ["Specialization", "Diagnosis", "Count"],
        diag.data.map((r, i) => (
          <TableRow key={i} hover>
            <TableCell>{r.specialization}</TableCell>
            <TableCell>{r.diagnosis}</TableCell>
            <TableCell>{r.count}</TableCell>
          </TableRow>
        )),
        diag,
        setDiag,
      )}
    </AdminLayout>
  );
}
