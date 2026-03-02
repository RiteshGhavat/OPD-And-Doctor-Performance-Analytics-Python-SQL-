import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import AuthNavbar from "../components/auth_navbar";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    date_of_birth: "",
    address: "",
    city: "",
    pincode: "",
    emergency_contact: "",
    role: "User"
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await API.post("/register/", formData);
      setSuccess(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <>
      <AuthNavbar />

      <div className="auth-container">
        <div className="auth-card large-card">
          <h1 className="auth-title">Register</h1>
          <p className="auth-subtitle">Create Hospital Analytics Account</p>

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}

          <form onSubmit={handleSubmit} className="grid-form">
            <input name="name" placeholder="Full Name" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
            <input name="phone" placeholder="Phone" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} required />

            <select name="gender" onChange={handleChange} required>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            <input name="date_of_birth" type="date" onChange={handleChange} required />
            <input name="address" placeholder="Address" onChange={handleChange} required />
            <input name="city" placeholder="City" onChange={handleChange} required />
            <input name="pincode" placeholder="Pincode" onChange={handleChange} required />
            <input name="emergency_contact" placeholder="Emergency Contact" onChange={handleChange} required />

            <button type="submit" className="primary-btn">
              Register
            </button>
          </form>

          <p className="switch-text">
            Already have an account?
            <span onClick={() => navigate("/login")}>Login here</span>
          </p>
        </div>
      </div>
    </>
  );
}

export default Register;