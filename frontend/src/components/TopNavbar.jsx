import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./css/TopNavbar.css";

export default function TopNavbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav className="game-navbar">
      <div className="nav-container">
        {/* Logo/Brand */}
        <Link className="nav-brand" to="/">
          <div className="brand-icon">🎮</div>
          <span className="brand-text">GameSphare</span>
        </Link>

        {/* Mobile Toggle */}
        <button className="nav-toggle" type="button">
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        {/* Navigation Menu */}
        <div className="nav-menu">
          <div className="nav-links">
            <Link className="nav-link" to="/">
              <i className="fas fa-home nav-icon"></i>
              Home
            </Link>
            
            {!isLoggedIn ? (
              <>
                <Link className="nav-link" to="/login">
                  <i className="fas fa-sign-in-alt nav-icon"></i>
                  Login
                </Link>
                <Link className="nav-btn primary" to="/register">
                  <i className="fas fa-user-plus btn-icon"></i>
                  Join Now
                </Link>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/dashboard">
                  <i className="fas fa-th-large nav-icon"></i>
                  Dashboard
                </Link>
                <Link className="nav-link" to="/dashboard/tournaments">
                  <i className="fas fa-trophy nav-icon"></i>
                  Tournaments
                </Link>
                <Link className="nav-link" to="/dashboard/messages">
                  <i className="fas fa-comments nav-icon"></i>
                  Messages
                </Link>
                <div className="nav-user">
                  <button className="nav-btn logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt btn-icon"></i>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}