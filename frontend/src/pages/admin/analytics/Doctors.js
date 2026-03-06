import { useEffect, useState, useCallback } from "react";
import API from "../../../api";
import AdminLayout from "../../../components/AdminLayout";
import {
  Card, CardContent, Typography, Table, TableBody,
  TableCell, TableHead, TableRow, TablePagination,
  Skeleton, Box, Chip,
} from "@mui/material";

const fmt = v => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

function TableSkeleton({ cols = 4, rows = 5 }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ background: "#f8fafc" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <TableCell key={i}><Skeleton width={80} height={18} /></TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <TableCell key={j}><Skeleton height={16} /></TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Generic paginated table section ───────────────────────────────────────────
function AnalyticsTable({ title, subtitle, headers, loading, state, setState, renderRows }) {
  return (
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 1, border: "1px solid #e2e8f0" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={600}>{title}</Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          {!loading && (
            <Chip size="small" label={`${state.total.toLocaleString()} records`}
              sx={{ background: "#f1f5f9", fontWeight: 600 }} />
          )}
        </Box>

        <div style={{ overflowX: "auto" }}>
          {loading
            ? <TableSkeleton cols={headers.length} rows={state.rows} />
            : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    {headers.map(h => (
                      <TableCell key={h}><b>{h}</b></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.data.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={headers.length} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                          No data available
                        </TableCell>
                      </TableRow>
                    )
                    : renderRows(state.data)
                  }
                </TableBody>
              </Table>
            )
          }
        </div>

        <TablePagination
          component="div"
          count={state.total}
          page={state.page}
          rowsPerPage={state.rows}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(e, p) => setState(prev => ({ ...prev, page: p }))}
          onRowsPerPageChange={e => setState(prev => ({ ...prev, rows: +e.target.value, page: 0 }))}
        />
      </CardContent>
    </Card>
  );
}

export default function DoctorsAnalytics() {
  const [opd,  setOpd]  = useState({ data: [], total: 0, page: 0, rows: 5 });
  const [perf, setPerf] = useState({ data: [], total: 0, page: 0, rows: 5 });
  const [diag, setDiag] = useState({ data: [], total: 0, page: 0, rows: 5 });

  const [loadingOpd,  setLoadingOpd]  = useState(true);
  const [loadingPerf, setLoadingPerf] = useState(true);
  const [loadingDiag, setLoadingDiag] = useState(true);

  // ── Each table fetches independently so one slow query doesn't block others ─
  const fetchOpd = useCallback(() => {
    setLoadingOpd(true);
    API.get("/admin/analytics/doctors/opd-load", {
      params: { page: opd.page + 1, limit: opd.rows },
    })
      .then(res => setOpd(prev => ({ ...prev, data: res.data.data, total: res.data.total })))
      .catch(console.error)
      .finally(() => setLoadingOpd(false));
  }, [opd.page, opd.rows]);

  const fetchPerf = useCallback(() => {
    setLoadingPerf(true);
    API.get("/admin/analytics/doctors/performance", {
      params: { page: perf.page + 1, limit: perf.rows },
    })
      .then(res => setPerf(prev => ({ ...prev, data: res.data.data, total: res.data.total })))
      .catch(console.error)
      .finally(() => setLoadingPerf(false));
  }, [perf.page, perf.rows]);

  const fetchDiag = useCallback(() => {
    setLoadingDiag(true);
    API.get("/admin/analytics/doctors/top-diagnoses", {
      params: { page: diag.page + 1, limit: diag.rows },
    })
      .then(res => setDiag(prev => ({ ...prev, data: res.data.data, total: res.data.total })))
      .catch(console.error)
      .finally(() => setLoadingDiag(false));
  }, [diag.page, diag.rows]);

  useEffect(() => { fetchOpd();  }, [fetchOpd]);
  useEffect(() => { fetchPerf(); }, [fetchPerf]);
  useEffect(() => { fetchDiag(); }, [fetchDiag]);

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Doctor Analytics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        OPD load, performance metrics, and diagnosis trends per doctor
      </Typography>

      {/* ── OPD LOAD ── */}
      <AnalyticsTable
        title="Doctor-wise OPD Load"
        subtitle="Monthly visit count per doctor per branch"
        headers={["Doctor", "Branch", "Month", "Visits"]}
        loading={loadingOpd}
        state={opd}
        setState={setOpd}
        renderRows={data => data.map((r, i) => (
          <TableRow key={i} hover>
            <TableCell sx={{ fontWeight: 500 }}>{r.doctor_name}</TableCell>
            <TableCell>{r.branch_name}</TableCell>
            <TableCell>{r.month}</TableCell>
            <TableCell>
              <Chip label={r.visit_count} size="small"
                sx={{ background: "#eff6ff", color: "#3b82f6", fontWeight: 700, minWidth: 40 }} />
            </TableCell>
          </TableRow>
        ))}
      />

      {/* ── PERFORMANCE ── */}
      <AnalyticsTable
        title="Doctor Performance"
        subtitle="Revenue and visit summary per doctor"
        headers={["Doctor", "Specialization", "Visits", "Revenue", "Avg Fee"]}
        loading={loadingPerf}
        state={perf}
        setState={setPerf}
        renderRows={data => data.map((r, i) => (
          <TableRow key={i} hover>
            <TableCell sx={{ fontWeight: 500 }}>{r.doctor_name}</TableCell>
            <TableCell>
              <Chip label={r.specialization || "—"} size="small"
                sx={{ fontSize: 11, height: 22, background: "#f1f5f9" }} />
            </TableCell>
            <TableCell>{r.total_visits?.toLocaleString()}</TableCell>
            <TableCell sx={{ color: "#10b981", fontWeight: 600 }}>
              {fmt(r.total_revenue)}
            </TableCell>
            <TableCell>{fmt(r.avg_fee)}</TableCell>
          </TableRow>
        ))}
      />

      {/* ── TOP DIAGNOSES ── */}
      <AnalyticsTable
        title="Top Diagnoses per Specialization"
        subtitle="Most frequent diagnoses grouped by doctor specialization"
        headers={["Specialization", "Diagnosis", "Count"]}
        loading={loadingDiag}
        state={diag}
        setState={setDiag}
        renderRows={data => data.map((r, i) => (
          <TableRow key={i} hover>
            <TableCell>
              <Chip label={r.specialization || "—"} size="small"
                sx={{ fontSize: 11, height: 22, background: "#f1f5f9" }} />
            </TableCell>
            <TableCell sx={{ fontWeight: 500 }}>{r.diagnosis}</TableCell>
            <TableCell>
              <Chip label={r.count} size="small"
                sx={{ background: "#fef9c3", color: "#854d0e", fontWeight: 700, minWidth: 40 }} />
            </TableCell>
          </TableRow>
        ))}
      />
    </AdminLayout>
  );
}