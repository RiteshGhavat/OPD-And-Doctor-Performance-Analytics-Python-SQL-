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
  DialogContentText,
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
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [form, setForm] = useState({
    branch_id: "",
    doctor_name: "",
    specialization: "",
    qualification: "",
    experience_years: "",
    consultation_fee: "",
    joining_date: "",
    status: "Active",
  });

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

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      branch_id: "",
      doctor_name: "",
      specialization: "",
      qualification: "",
      experience_years: "",
      consultation_fee: "",
      joining_date: "",
      status: "Active",
    });
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

  const openDeleteDialog = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setDeletingId(selectedDoctor.doctor_id);
      await API.post(`/doctor/${selectedDoctor.doctor_id}/soft-delete`);
      showSnackbar("Doctor deleted successfully");
      fetchDoctors();
    } catch {
      showSnackbar("Delete failed", "error");
    } finally {
      setDeletingId(null);
      setOpenDialog(false);
    }
  };

  const rowsWithIndex = useMemo(() => {
    return doctors.map((doc, index) => ({
      ...doc,
      sr_no: index + 1,
    }));
  }, [doctors]);

  const columns = [
    { field: "sr_no", headerName: "SR No.", width: 90 },
    { field: "doctor_name", headerName: "Name", flex: 1 },
    { field: "branch_name", headerName: "Branch", flex: 1 },
    { field: "specialization", headerName: "Specialization", flex: 1 },
    { field: "qualification", headerName: "Qualification", flex: 1 },
    { field: "experience_years", headerName: "Experience", flex: 1 },
    { field: "consultation_fee", headerName: "Fee", flex: 1 },
    { field: "joining_date", headerName: "Joining Date", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    {
      field: "edit",
      headerName: "Edit",
      width: 100,
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
      width: 110,
      renderCell: (params) => (
        <Button
          size="small"
          color="error"
          variant="contained"
          disabled={deletingId === params.row.doctor_id}
          onClick={() => openDeleteDialog(params.row)}
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
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Doctor Name"
                  name="doctor_name"
                  value={form.doctor_name}
                  onChange={handleChange}
                  required
                  size="small"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Branch"
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  required
                  size="small"
                  SelectProps={{
                    displayEmpty: true,
                  }}
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

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Specialization"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Experience (Years)"
                  name="experience_years"
                  type="number"
                  value={form.experience_years}
                  onChange={handleChange}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Consultation Fee"
                  name="consultation_fee"
                  type="number"
                  value={form.consultation_fee}
                  onChange={handleChange}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  name="joining_date"
                  type="date"
                  value={form.joining_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  size="small"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Deactive">Deactive</MenuItem>
                </TextField>
              </Grid>

          
              <Grid item xs={12} md={6}>
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
    </AdminLayout>
  );
}

export default Doctor;
