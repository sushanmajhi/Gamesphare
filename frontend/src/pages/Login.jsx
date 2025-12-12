import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";

export default function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.username || !form.password) {
      setError("Both fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("login/", form);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      setIsLoggedIn(true);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
      console.error(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center" style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)" }}>
      <div className="card p-5 shadow-lg rounded-4" style={{ maxWidth: "450px", width: "100%" }}>
        <h2 className="text-center fw-bold text-primary mb-4">Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" name="username" className="form-control" placeholder="Enter username" value={form.username} onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-control" placeholder="Enter password" value={form.password} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-muted">
          Don't have an account? <Link to="/register" className="text-primary">Register</Link>
        </p>
      </div>
    </div>
  );
}
