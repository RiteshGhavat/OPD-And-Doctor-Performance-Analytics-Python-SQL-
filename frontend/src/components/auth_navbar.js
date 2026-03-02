import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/auth.css";

function AuthNavbar() {
  const location = useLocation();

  return (
    <nav className="auth-navbar">
      <div className="auth-logo">
        🏥 Hospital Analytics
      </div>

      <div className="auth-nav-links">
        <Link
          to="/login"
          className={`auth-link ${
            location.pathname === "/login" ? "active-link" : ""
          }`}
        >
          Login
        </Link>

        <Link
          to="/register"
          className={`auth-link ${
            location.pathname === "/register" ? "active-link" : ""
          }`}
        >
          Register
        </Link>
      </div>
    </nav>
  );
}

export default AuthNavbar;