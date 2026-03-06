import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AdminLayout from "../../components/AdminLayout";
import API from "../../api";

const emptyForm = { branch_name: "", city: "", address: "", phone: "" };

export default function BranchManagement() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchBranches();
  }, [page, pageSize]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await API.get(
        `/admin/branch?page=${page + 1}&limit=${pageSize}`,
      );
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch {
      showSnackbar("Failed to fetch branches", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editData) {
        await API.put(`/admin/branch/${editData.branch_id}`, form);
        showSnackbar("Branch updated successfully");
      } else {
        await API.post("/admin/branch", form);
        showSnackbar("Branch created successfully");
      }
      setOpen(false);
      fetchBranches();
    } catch (err) {
      showSnackbar(err.response?.data?.detail || "Error", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this branch?")) return;
    try {
      await API.post(`/admin/branch/${id}/soft-delete`);
      showSnackbar("Branch deleted successfully");
      fetchBranches();
    } catch {
      showSnackbar("Delete failed", "error");
    }
  };

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const columns = [
    { field: "branch_id", headerName: "ID", width: 70 },
    { field: "branch_name", headerName: "Branch Name", flex: 1, minWidth: 140 },
    { field: "city", headerName: "City", flex: 1, minWidth: 110 },
    { field: "phone", headerName: "Phone", flex: 1, minWidth: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              setEditData(params.row);
              setForm(params.row);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="contained"
            onClick={() => handleDelete(params.row.branch_id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Branch Management
      </Typography>

      <Button
        variant="contained"
        className="primary-btn"
        sx={{ mb: 2 }}
        onClick={() => {
          setEditData(null);
          setForm(emptyForm);
          setOpen(true);
        }}
      >
        + Add Branch
      </Button>

      <Card className="table-card">
        <CardContent>
          <div style={{ height: 500 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.branch_id}
              rowCount={total}
              loading={loading}
              paginationMode="server"
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editData ? "Edit Branch" : "Add Branch"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {[
              { label: "Branch Name", name: "branch_name" },
              { label: "City", name: "city" },
              { label: "Address", name: "address" },
              { label: "Phone", name: "phone" },
            ].map(({ label, name }) => (
              <Grid item xs={12} key={name}>
                <TextField
                  label={label}
                  name={name}
                  fullWidth
                  value={form[name]}
                  onChange={handleChange}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </AdminLayout>
  );
}
