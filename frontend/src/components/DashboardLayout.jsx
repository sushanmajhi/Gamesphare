import React from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import Overview from "./Overview";
import Profile from "./Profile";
import FriendProfile from "./FriendProfile";
import Settings from "./Settings";
import Messages from "./Messages";
import Tournament from "./Tournament"; // Import Tournament component
import "./css/DashboardLayout.css";

export default function DashboardLayout({ setIsLoggedIn }) {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <div className="sidebar bg-dark text-light p-3">
        <h3 className="mb-4">GameSphare</h3>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link to="/dashboard/overview" className="nav-link text-light">Home Feed</Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/profile" className="nav-link text-light">My Profile</Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/messages" className="nav-link text-light">Messages</Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/tournaments" className="nav-link text-light">Tournaments</Link> {/* Fixed this line */}
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/settings" className="nav-link text-light">Settings</Link>
          </li>
        </ul>
      </div>

      <div className="main-content flex-grow-1 p-4">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:username" element={<FriendProfile />} />
          <Route path="messages" element={<Messages />} />
          <Route path="tournaments" element={<Tournament />} /> {/* Add this route */}
          <Route path="settings" element={<Settings setIsLoggedIn={setIsLoggedIn} />} />
        </Routes>
      </div>
    </div>
  );
}