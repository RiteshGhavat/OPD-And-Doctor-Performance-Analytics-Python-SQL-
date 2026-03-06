import React, { useEffect, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/AdminLayout";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  gender: "",
  date_of_birth: "",
  address: "",
  city: "",
  pincode: "",
  emergency_contact: "",
};

const fieldConfig = [
  { key: "name", label: "Full Name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "text" },
  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: ["Male", "Female", "Other"],
  },
  { key: "date_of_birth", label: "Date of Birth", type: "date" },
  { key: "address", label: "Address", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "pincode", label: "Pincode", type: "text" },
  { key: "emergency_contact", label: "Emergency Contact", type: "text" },
];

export default function Users() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  const fetchUsers = async () => {
    try {
      const res = await API.get(
        `/admin/users?page=${page + 1}&limit=${pageSize}`,
      );
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch {
      showSnack("Failed to fetch users", "error");
    }
  };

  const showSnack = (msg, type = "success") =>
    setSnack({ open: true, msg, type });

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      password: "",
      gender: row.gender || "",
      date_of_birth: row.date_of_birth || "",
      address: row.address || "",
      city: row.city || "",
      pincode: row.pincode || "",
      emergency_contact: row.emergency_contact || "",
    });
    setEditId(row.patient_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password;

    try {
      if (editId) {
        await API.put(`/admin/users/${editId}`, payload);
        showSnack("User updated successfully");
      } else {
        if (!form.password) {
          showSnack("Password is required", "error");
          return;
        }
        await API.post("/admin/users", payload);
        showSnack("User created successfully");
      }
      resetForm();
      fetchUsers();
    } catch {
      showSnack("Operation failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.post(`/admin/users/${id}/soft-delete`);
      showSnack("User deleted successfully");
      fetchUsers();
    } catch {
      showSnack("Failed to delete user", "error");
    }
  };

  const columns = [
    { field: "patient_id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", flex: 1, minWidth: 120 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 160 },
    { field: "phone", headerName: "Phone", flex: 1, minWidth: 120 },
    { field: "city", headerName: "City", width: 110 },
    { field: "gender", headerName: "Gender", width: 90 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      renderCell: (p) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleEdit(p.row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="contained"
            onClick={() => handleDelete(p.row.patient_id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage patient accounts
      </Typography>

      <Card className="form-card" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" className="form-title">
            {editId ? "Update User" : "Add New User"}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {fieldConfig.map(({ key, label, type, options }) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  {type === "select" ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={label}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                    >
                      <MenuItem value="">
                        <em>Select {label}</em>
                      </MenuItem>
                      {options.map((o) => (
                        <MenuItem key={o} value={o}>
                          {o}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      label={label}
                      type={type}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      InputLabelProps={type === "date" ? { shrink: true } : {}}
                    />
                  )}
                </Grid>
              ))}

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Password"
                  required={!editId}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  helperText={
                    editId ? "Leave blank to keep existing password" : ""
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <div className="form-buttons">
                  <Button
                    type="submit"
                    variant="contained"
                    className="primary-btn"
                  >
                    {editId ? "Update User" : "Create User"}
                  </Button>
                  {editId && (
                    <Button
                      variant="outlined"
                      onClick={resetForm}
                      className="secondary-btn"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            All Users
          </Typography>
          <div style={{ height: 520 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(r) => r.patient_id}
              rowCount={total}
              paginationMode="server"
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(m) => {
                setPage(m.page);
                setPageSize(m.pageSize);
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        </CardContent>
      </Card>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.type}>{snack.msg}</Alert>
      </Snackbar>
    </AdminLayout>
  );
}
