import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/admin.css";

function AdminLayout({ children }) {
  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;
