import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import AuthNavbar from "../components/auth_navbar";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      if (role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/login/", formData);

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", response.data.role);

      if (response.data.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthNavbar />

      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Hospital Analytics Dashboard</p>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <input
              name="email"
              type="email"
              placeholder="Enter Email"
              onChange={handleChange}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Enter Password"
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="switch-text">
            Don’t have an account?
            <span onClick={() => navigate("/register")}>
              Register here
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;