import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login"); // better than "/"
  };

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  return (
    <div className="sidebar">
      <h2 className="logo">Hospital Analytics</h2>

      <nav className="menu">
        <NavLink to="/admin/dashboard" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/admin/users" className={linkClass}>
          Users
        </NavLink>

        <NavLink to="/admin/doctors" className={linkClass}>
          Doctors
        </NavLink>

        <NavLink to="/admin/branches" className={linkClass}>
          Branches
        </NavLink>

        {/* Analytics Section */}
        <div className="menu-title">Analytics</div>

        <div className="submenu">
          <NavLink to="/admin/analytics/overview" className={linkClass}>
            Overview
          </NavLink>

          <NavLink to="/admin/analytics/doctors" className={linkClass}>
            Doctor Analytics
          </NavLink>

          <NavLink to="/admin/analytics/revenue" className={linkClass}>
            Revenue
          </NavLink>

          <NavLink to="/admin/analytics/peak-hours" className={linkClass}>
            Peak Hours
          </NavLink>
        </div>
      </nav>

      <button className="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

export default Sidebar;