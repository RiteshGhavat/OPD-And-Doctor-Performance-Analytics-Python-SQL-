import { NavLink, useNavigate } from "react-router-dom";

function UserSidebar() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    isActive ? "user-link active" : "user-link";

  return (
    <div className="user-sidebar">
      <h2 className="user-logo">Hospital Analytics</h2>

      <div className="user-profile">
        👤 {userName}
      </div>

      <nav className="user-menu">
        <NavLink to="/user/dashboard" className={linkClass}>
          My Dashboard
        </NavLink>
      </nav>

      <button className="user-logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

export default UserSidebar;