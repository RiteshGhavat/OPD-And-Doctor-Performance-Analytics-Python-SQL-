import React, { useEffect, useState, useMemo } from "react";
import API from "../../api";
import AdminLayout from "../../components/AdminLayout";

import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

function Doctor() {
  const [doctors, setDoctors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const emptyForm = {
    branch_id: "",
    doctor_name: "",
    specialization: "",
    qualification: "",
    experience_years: "",
    consultation_fee: "",
    joining_date: "",
    status: "Active",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchDoctors();
    fetchBranches();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/doctor/");
      setDoctors(res.data);
    } catch {
      showSnackbar("Failed to fetch doctors", "error");
    }
  };
  const fetchBranches = async () => {
    try {
      const res = await API.get("/branch/");
      setBranches(res.data);
    } catch {
      showSnackbar("Failed to fetch branches", "error");
    }
  };

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.branch_id || !form.doctor_name) {
      showSnackbar("Branch and Doctor Name are required", "error");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await API.put(`/doctor/${editId}`, form);
        showSnackbar("Doctor updated successfully");
      } else {
        await API.post("/doctor/", form);
        showSnackbar("Doctor created successfully");
      }
      fetchDoctors();
      resetForm();
    } catch (err) {
      showSnackbar(err.response?.data?.detail || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setForm({
      branch_id: row.branch_id || "",
      doctor_name: row.doctor_name || "",
      specialization: row.specialization || "",
      qualification: row.qualification || "",
      experience_years: row.experience_years || "",
      consultation_fee: row.consultation_fee || "",
      joining_date: row.joining_date ? row.joining_date.substring(0, 10) : "",
      status: row.status || "Active",
    });
    setEditId(row.doctor_id);
  };

  const confirmDelete = async () => {
    try {
      setDeletingId(selectedDoc.doctor_id);
      await API.post(`/doctor/${selectedDoc.doctor_id}/soft-delete`);
      showSnackbar("Doctor deleted successfully");
      fetchDoctors();
    } catch {
      showSnackbar("Delete failed", "error");
    } finally {
      setDeletingId(null);
      setOpenDialog(false);
    }
  };

  const rowsWithIndex = useMemo(
    () => doctors.map((doc, index) => ({ ...doc, sr_no: index + 1 })),
    [doctors],
  );

  const columns = [
    { field: "sr_no", headerName: "SR", width: 60 },
    { field: "doctor_name", headerName: "Name", flex: 1, minWidth: 130 },
    { field: "branch_name", headerName: "Branch", flex: 1, minWidth: 110 },
    {
      field: "specialization",
      headerName: "Specialization",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "qualification",
      headerName: "Qualification",
      flex: 1,
      minWidth: 120,
    },
    { field: "experience_years", headerName: "Exp", width: 70 },
    { field: "consultation_fee", headerName: "Fee", width: 80 },
    { field: "joining_date", headerName: "Joining", width: 110 },
    { field: "status", headerName: "Status", width: 90 },
    {
      field: "edit",
      headerName: "Edit",
      width: 90,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => handleEdit(params.row)}
        >
          Edit
        </Button>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 100,
      renderCell: (params) => (
        <Button
          size="small"
          color="error"
          variant="contained"
          disabled={deletingId === params.row.doctor_id}
          onClick={() => {
            setSelectedDoc(params.row);
            setOpenDialog(true);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Doctor Management
      </Typography>

      <Card className="form-card" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" className="form-title">
            {editId ? "Update Doctor" : "Add New Doctor"}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Doctor Name"
                  name="doctor_name"
                  value={form.doctor_name}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Branch"
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">
                    <em>Select Branch</em>
                  </MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.branch_id} value={b.branch_id}>
                      {b.branch_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Specialization"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Experience (Years)"
                  name="experience_years"
                  type="number"
                  value={form.experience_years}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Consultation Fee"
                  name="consultation_fee"
                  type="number"
                  value={form.consultation_fee}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Joining Date"
                  name="joining_date"
                  type="date"
                  value={form.joining_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Deactive">Deactive</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <div className="form-buttons">
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    className="primary-btn"
                  >
                    {loading
                      ? "Processing..."
                      : editId
                        ? "Update Doctor"
                        : "Add Doctor"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    className="secondary-btn"
                  >
                    Clear
                  </Button>
                </div>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardContent>
          <div style={{ height: 550 }}>
            <DataGrid
              rows={rowsWithIndex}
              columns={columns}
              getRowId={(row) => row.doctor_id}
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Delete Doctor</DialogTitle>
        <DialogContent>
          Are you sure you want to delete{" "}
          <strong>{selectedDoc?.doctor_name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
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

export default Doctor;
