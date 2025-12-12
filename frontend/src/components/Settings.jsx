import React from "react";
import { useNavigate } from "react-router-dom";

export default function Settings({ setIsLoggedIn }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="card p-4 shadow">
      <h4>Settings ⚙️</h4>
      <hr />
      <div className="d-grid gap-2">
        <button className="btn btn-danger btn-lg" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}