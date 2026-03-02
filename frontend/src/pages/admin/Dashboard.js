import { useEffect, useState } from "react";
import API from "../../api";
import AdminLayout from "../../components/AdminLayout";

function Dashboard() {
  const [data, setData] = useState({});

  useEffect(() => {
    API.get("/admin/dashboard/")
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <AdminLayout>
      <div className="dashboard-grid">

        <div className="card">
          <h4>Total Branches</h4>
          <h2>{data.branches || 0}</h2>
        </div>

        <div className="card">
          <h4>Total Doctors</h4>
          <h2>{data.doctors || 0}</h2>
        </div>

        <div className="card">
          <h4>Total Users</h4>
          <h2>{data.users || 0}</h2>
        </div>

        <div className="card">
          <h4>Total Visits</h4>
          <h2>{data.visits || 0}</h2>
        </div>

      </div>
    </AdminLayout>
  );
}

export default Dashboard;