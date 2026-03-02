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
    const res = await API.get(url, {
      params: { page: state.page + 1, limit: state.rows },
    });
    setter({ ...state, data: res.data.data, total: res.data.total });
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

  const table = (title, headers, rows, state, setState) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>

        <TablePagination
          component="div"
          count={state.total}
          page={state.page}
          rowsPerPage={state.rows}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(e, p) => setState({ ...state, page: p })}
          onRowsPerPageChange={(e) =>
            setState({ ...state, rows: +e.target.value, page: 0 })
          }
        />
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Doctor Analytics
      </Typography>

      {table(
        "Doctor-wise OPD Load",
        ["Doctor", "Branch", "Month", "Visits"],
        opd.data.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r.doctor_name}</TableCell>
            <TableCell>{r.branch_name}</TableCell>
            <TableCell>{r.month}</TableCell>
            <TableCell>{r.visit_count}</TableCell>
          </TableRow>
        )),
        opd,
        setOpd,
      )}

      {table(
        "Doctor Performance",
        ["Doctor", "Visits", "Revenue", "Avg Fee"],
        perf.data.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r.doctor_name}</TableCell>
            <TableCell>{r.total_visits}</TableCell>
            <TableCell>₹ {r.total_revenue}</TableCell>
            <TableCell>₹ {r.avg_fee}</TableCell>
          </TableRow>
        )),
        perf,
        setPerf,
      )}

      {table(
        "Top Diagnoses",
        ["Specialization", "Diagnosis", "Count"],
        diag.data.map((r, i) => (
          <TableRow key={i}>
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
