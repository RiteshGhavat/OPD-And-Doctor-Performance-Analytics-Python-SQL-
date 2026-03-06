import { NavLink, useNavigate } from "react-router-dom";

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🏥</div>
            <span>Hospital Analytics</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="menu">
            <NavLink
              to="/admin/dashboard"
              className={linkClass}
              onClick={onClose}
            >
              📊 Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={linkClass} onClick={onClose}>
              👥 Users
            </NavLink>
            <NavLink
              to="/admin/doctors"
              className={linkClass}
              onClick={onClose}
            >
              🩺 Doctors
            </NavLink>
            <NavLink
              to="/admin/branches"
              className={linkClass}
              onClick={onClose}
            >
              🏢 Branches
            </NavLink>

            <div className="menu-title">Analytics</div>
            <div className="submenu">
              <NavLink
                to="/admin/analytics/overview"
                className={linkClass}
                onClick={onClose}
              >
                📈 Overview
              </NavLink>
              <NavLink
                to="/admin/analytics/doctors"
                className={linkClass}
                onClick={onClose}
              >
                👨‍⚕️ Doctor Analytics
              </NavLink>
              <NavLink
                to="/admin/analytics/revenue"
                className={linkClass}
                onClick={onClose}
              >
                💰 Revenue
              </NavLink>
              <NavLink
                to="/admin/analytics/peak-hours"
                className={linkClass}
                onClick={onClose}
              >
                ⏰ Peak Hours
              </NavLink>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
