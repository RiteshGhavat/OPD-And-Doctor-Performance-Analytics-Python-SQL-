import { NavLink, useNavigate } from "react-router-dom";

function UserSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name") || "User";
  const initials = userName.slice(0, 2).toUpperCase();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    isActive ? "user-link active" : "user-link";

  return (
    <>
      <div
        className={`user-sidebar-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <div className={`user-sidebar ${open ? "open" : ""}`}>
        <div className="user-sidebar-header">
          <div className="user-logo">
            <div className="user-logo-icon">🏥</div>
            <span>Hospital Analytics</span>
          </div>
        </div>

        <nav className="user-sidebar-nav">
          <div className="user-profile-card">
            <div className="user-profile-avatar">{initials}</div>
            <div>
              <div className="user-profile-name">{userName}</div>
              <div className="user-profile-role">Patient</div>
            </div>
          </div>

          <div className="user-menu">
            <NavLink
              to="/user/dashboard"
              className={linkClass}
              onClick={onClose}
            >
              🏠 My Dashboard
            </NavLink>
          </div>
        </nav>

        <div className="user-sidebar-footer">
          <button className="user-logout" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default UserSidebar;
