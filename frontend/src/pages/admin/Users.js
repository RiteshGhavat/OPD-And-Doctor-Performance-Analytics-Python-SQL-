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
  Alert
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
  emergency_contact: ""
};

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
      const res = await API.get(`/admin/users?page=${page + 1}&limit=${pageSize}`);
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      setSnack({ open: true, msg: "Failed to fetch users", type: "error" });
    }
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      password: "", // Password not shown
      gender: row.gender || "",
      date_of_birth: row.date_of_birth || "",
      address: row.address || "",
      city: row.city || "",
      pincode: row.pincode || "",
      emergency_contact: row.emergency_contact || ""
    });
    setEditId(row.patient_id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      date_of_birth: form.date_of_birth,
      address: form.address,
      city: form.city,
      pincode: form.pincode,
      emergency_contact: form.emergency_contact
    };

    if (form.password) payload.password = form.password;

    try {
      if (editId) {
        await API.put(`/admin/users/${editId}`, payload);
        setSnack({ open: true, msg: "User updated successfully", type: "success" });
      } else {
        if (!form.password) {
          setSnack({ open: true, msg: "Password is required", type: "error" });
          return;
        }
        await API.post("/admin/users", payload);
        setSnack({ open: true, msg: "User created successfully", type: "success" });
      }
      setForm(emptyForm);
      setEditId(null);
      fetchUsers();
    } catch (error) {
      setSnack({ open: true, msg: "Operation failed", type: "error" });
    }
  };

  // Soft delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.post(`/admin/users/${id}/soft-delete`);
      setSnack({ open: true, msg: "User deleted successfully", type: "success" });
      fetchUsers();
    } catch (error) {
      setSnack({ open: true, msg: "Failed to delete user", type: "error" });
    }
  };

  const columns = [
    { field: "patient_id", headerName: "ID", width: 80 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (p) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button size="small" onClick={() => handleEdit(p.row)}>
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(p.row.patient_id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      {/* Form Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">{editId ? "Update User" : "Add User"}</Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {[
                "name",
                "email",
                "phone",
                "gender",
                "date_of_birth",
                "address",
                "city",
                "pincode",
                "emergency_contact"
              ].map((k) => (
                <Grid item xs={12} md={4} key={k}>
                  <TextField
                    fullWidth
                    required
                    label={k.replace("_", " ").toUpperCase()}
                    type={k === "date_of_birth" ? "date" : "text"}
                    InputLabelProps={k === "date_of_birth" ? { shrink: true } : {}}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </Grid>
              ))}

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="password"
                  label="PASSWORD"
                  required={!editId}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  {editId ? "Update" : "Create"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent>
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
            autoHeight
          />
        </CardContent>
      </Card>

      {/* Snackbar */}
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