import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import TopNavbar from "./components/TopNavbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./components/Overview";
import Profile from "./components/Profile";
import FriendProfile from "./components/FriendProfile";
import Settings from "./components/Settings";
import Messages from "./components/Messages";
import Tournament from './components/Tournament';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access"));

  return (
    <>
      <TopNavbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={!isLoggedIn ? <Login setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!isLoggedIn ? <Register /> : <Navigate to="/dashboard" />}
        />

       
        <Route
          path="/dashboard/*"
          element={isLoggedIn ? <DashboardLayout setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}