import React, { useEffect, useState, useCallback } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/UserLayout";

function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState({
    branch_id: "",
    doctor_id: "",
    visit_datetime: "",
    consultation_type: "New",
  });
  const [bookingMsg, setBookingMsg] = useState("");
  const navigate = useNavigate();

  // ── FETCH DASHBOARD ──────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await API.get("/user/dashboard/");
      setData(response.data);
      localStorage.setItem("user_name", response.data.patient.name);
    } catch {
      alert("Unauthorized. Please login again.");
      localStorage.clear();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── FETCH BRANCHES ───────────────────────────────────────────────────────
  useEffect(() => {
    API.get("/user/dashboard/branches")
      .then((res) => setBranches(res.data))
      .catch(console.error);
  }, []);

  // ── FETCH DOCTORS WHEN BRANCH CHANGES ────────────────────────────────────
  useEffect(() => {
    if (booking.branch_id) {
      API.get(`/user/dashboard/doctors?branch_id=${booking.branch_id}`)
        .then((res) => setDoctors(res.data))
        .catch(console.error);
    } else {
      setDoctors([]);
    }
  }, [booking.branch_id]);

  // ── HANDLE BOOKING ───────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!booking.branch_id || !booking.doctor_id || !booking.visit_datetime) {
      setBookingMsg("Please fill all fields.");
      return;
    }
    try {
      await API.post("/user/dashboard/book", booking);
      setBookingMsg("✅ Appointment booked successfully!");
      setShowModal(false);
      setBooking({
        branch_id: "",
        doctor_id: "",
        visit_datetime: "",
        consultation_type: "New",
      });
      fetchDashboard();
    } catch (err) {
      setBookingMsg("❌ Booking failed. Please try again.");
    }
  };

  if (loading)
    return <h3 style={{ textAlign: "center", marginTop: 40 }}>Loading...</h3>;
  if (!data)
    return (
      <h3 style={{ textAlign: "center", marginTop: 40 }}>No Data Found</h3>
    );

  const totalSpent = (data.recent_visits || []).reduce(
    (sum, v) => sum + (v.billing?.total_amount || 0),
    0,
  );

  return (
    <UserLayout>
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Welcome, {data.patient.name} 👋</h2>
          <p style={{ color: "#666", margin: 0 }}>
            Manage your OPD visits and appointments
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setBookingMsg("");
          }}
          style={btnStyle}
        >
          + Book OPD Appointment
        </button>
      </div>

      {bookingMsg && (
        <div
          style={{
            padding: "10px 16px",
            background: "#e8f5e9",
            borderRadius: 8,
            marginBottom: 16,
            color: "#2e7d32",
          }}
        >
          {bookingMsg}
        </div>
      )}

      {/* ── SUMMARY CARDS ── */}
      <div style={gridStyle}>
        {[
          { label: "Total Visits", value: data.total_visits },
          { label: "Total Spent", value: `₹ ${totalSpent.toLocaleString()}` },
          {
            label: "Last Visit",
            value:
              data.recent_visits?.length > 0
                ? new Date(
                    data.recent_visits[0].visit_datetime,
                  ).toLocaleDateString()
                : "N/A",
          },
        ].map((c, i) => (
          <div key={i} style={cardStyle}>
            <p style={{ color: "#888", margin: "0 0 4px" }}>{c.label}</p>
            <h3 style={{ margin: 0 }}>{c.value}</h3>
          </div>
        ))}
      </div>

      {/* ── PROFILE ── */}
      <div style={{ ...cardStyle, marginTop: 24 }}>
        <h4 style={{ marginTop: 0 }}>Patient Profile</h4>
        <hr />
        {[
          ["Name", data.patient.name],
          ["Email", data.patient.email],
          ["Phone", data.patient.phone],
          ["Gender", data.patient.gender],
          ["Address", data.patient.address],
          ["City", data.patient.city],
        ].map(([label, val]) => (
          <p key={label} style={{ margin: "6px 0" }}>
            <strong>{label}:</strong> {val || "—"}
          </p>
        ))}
      </div>

      {/* ── RECENT VISITS ── */}
      <h3 style={{ marginTop: 32 }}>Recent OPD Visits</h3>
      {!data.recent_visits || data.recent_visits.length === 0 ? (
        <p style={{ color: "#888" }}>No visits found.</p>
      ) : (
        <div style={gridStyle}>
          {data.recent_visits.map((visit) => (
            <div key={visit.visit_id} style={cardStyle}>
              <h4 style={{ marginTop: 0 }}>Visit #{visit.visit_id}</h4>
              <hr />
              <p>
                <strong>Date:</strong>{" "}
                {new Date(visit.visit_datetime).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {visit.visit_status}
              </p>
              <p>
                <strong>Type:</strong> {visit.consultation_type}
              </p>
              <p>
                <strong>Doctor:</strong> {visit.doctor_name || "—"}
              </p>
              <p>
                <strong>Branch:</strong> {visit.branch_name || "—"}
              </p>

              {visit.diagnoses?.length > 0 && (
                <p>
                  <strong>Diagnoses:</strong> {visit.diagnoses.join(", ")}
                </p>
              )}

              {visit.prescriptions?.length > 0 && (
                <div>
                  <strong>Prescriptions:</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: 18 }}>
                    {visit.prescriptions.map((p, i) => (
                      <li key={i}>
                        {p.medicine} — {p.dose} ({p.days} days)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {visit.billing && (
                <p>
                  <strong>Bill:</strong> ₹{visit.billing.total_amount} |{" "}
                  <strong>Paid:</strong> ₹{visit.billing.paid_amount} |{" "}
                  <span
                    style={{
                      color:
                        visit.billing.payment_status === "Paid"
                          ? "green"
                          : "orange",
                    }}
                  >
                    {visit.billing.payment_status}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── BOOKING MODAL ── */}
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginTop: 0 }}>Book OPD Appointment</h3>

            <label style={labelStyle}>Branch</label>
            <select
              style={inputStyle}
              value={booking.branch_id}
              onChange={(e) =>
                setBooking({
                  ...booking,
                  branch_id: e.target.value,
                  doctor_id: "",
                })
              }
            >
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>

            <label style={labelStyle}>Doctor</label>
            <select
              style={inputStyle}
              value={booking.doctor_id}
              onChange={(e) =>
                setBooking({ ...booking, doctor_id: e.target.value })
              }
              disabled={!booking.branch_id}
            >
              <option value="">Select Doctor</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.doctor_name} — {d.specialization} (₹{d.consultation_fee})
                </option>
              ))}
            </select>

            <label style={labelStyle}>Appointment Date & Time</label>
            <input
              style={inputStyle}
              type="datetime-local"
              value={booking.visit_datetime}
              onChange={(e) =>
                setBooking({ ...booking, visit_datetime: e.target.value })
              }
            />

            <label style={labelStyle}>Consultation Type</label>
            <select
              style={inputStyle}
              value={booking.consultation_type}
              onChange={(e) =>
                setBooking({ ...booking, consultation_type: e.target.value })
              }
            >
              <option value="New">New</option>
              <option value="Follow-up">Follow-up</option>
            </select>

            {bookingMsg && (
              <p style={{ color: "red", marginTop: 8 }}>{bookingMsg}</p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleBook} style={btnStyle}>
                Confirm Booking
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{ ...btnStyle, background: "#888" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
};
const cardStyle = {
  background: "#fff",
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};
const btnStyle = {
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  cursor: "pointer",
  fontWeight: 600,
};
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 32,
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 6,
  border: "1px solid #ddd",
  marginBottom: 14,
  fontSize: 14,
  boxSizing: "border-box",
};
const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#555",
  display: "block",
  marginBottom: 4,
};

export default UserDashboard;
