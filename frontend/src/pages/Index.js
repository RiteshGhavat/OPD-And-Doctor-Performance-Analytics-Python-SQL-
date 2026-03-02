import React from "react";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "../components/auth_navbar";
import "../styles/landing.css";

function Index() {
  const navigate = useNavigate();

  return (
    <>
      <AuthNavbar />

      <div className="landing-container">
        <div className="hero-section">
          <h1 className="hero-title">
            Welcome to <span>Hospital Analytics</span>
          </h1>

          <p className="hero-subtitle">
            Advanced Doctor Performance & OPD Analytics Dashboard
            for Multi-Branch Hospital Management
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

            <button
              className="secondary-btn"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Index;