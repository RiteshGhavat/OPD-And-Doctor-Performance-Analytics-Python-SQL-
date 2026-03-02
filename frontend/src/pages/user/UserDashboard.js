import React, { useEffect, useState, useCallback } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/UserLayout";   // ✅ IMPORT LAYOUT

function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await API.get("/user/dashboard/");
      setData(response.data);
      localStorage.setItem("user_name", response.data.patient.name);
    } catch (error) {
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

  if (loading) return <h3>Loading...</h3>;
  if (!data) return <h3>No Data Found</h3>;

  const totalVisits = data.visits.length;
  const totalAmount = data.visits.reduce(
    (sum, visit) => sum + (visit.billing?.total || 0),
    0
  );

  return (
    <UserLayout>   {/* ✅ WRAP EVERYTHING */}
      
      {/* ================= SUMMARY CARDS ================= */}
      <div className="user-grid">
        <div className="user-card">
          <h4>Total Visits</h4>
          <p>{totalVisits}</p>
        </div>

        <div className="user-card">
          <h4>Total Spent</h4>
          <p>₹{totalAmount}</p>
        </div>

        <div className="user-card">
          <h4>Last Visit</h4>
          <p>
            {totalVisits > 0
              ? new Date(data.visits[0].visit_datetime).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      {/* ================= PROFILE CARD ================= */}
      <div className="user-card" style={{ marginTop: "25px" }}>
        <h4>Patient Profile</h4>
        <hr />

        <p><strong>Name:</strong> {data.patient.name}</p>
        <p><strong>Email:</strong> {data.patient.email}</p>
        <p><strong>Phone:</strong> {data.patient.phone}</p>
        <p><strong>Gender:</strong> {data.patient.gender}</p>
        <p><strong>Age:</strong> {data.patient.age}</p>
        <p><strong>Address:</strong> {data.patient.address}</p>
      </div>

      {/* ================= VISITS LIST ================= */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "15px" }}>Your OPD Visits</h3>

        <div className="user-grid">
          {data.visits.map((visit) => (
            <div key={visit.visit_id} className="user-card">
              <h4>Visit #{visit.visit_id}</h4>
              <hr />

              <p>
                <strong>Date:</strong>{" "}
                {new Date(visit.visit_datetime).toLocaleString()}
              </p>

              <p>
                <strong>Status:</strong> {visit.visit_status}
              </p>

              <p>
                <strong>Doctor:</strong> {visit.doctor?.name}
              </p>

              <p>
                <strong>Branch:</strong> {visit.branch?.name}
              </p>

              <p>
                <strong>Total Bill:</strong> ₹{visit.billing?.total}
              </p>
            </div>
          ))}
        </div>
      </div>

    </UserLayout>
  );
}

export default UserDashboard;