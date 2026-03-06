import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-container">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;
