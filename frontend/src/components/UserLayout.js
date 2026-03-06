import { useState } from "react";
import UserSidebar from "./UserSidebar";
import UserNavbar from "./UserNavbar";
import "../styles/user.css";

function UserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="user-container">
      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="user-main">
        <UserNavbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="user-content">{children}</div>
      </div>
    </div>
  );
}

export default UserLayout;
