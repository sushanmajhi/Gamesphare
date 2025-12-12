import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/register/", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      if (response.status === 201) {
        localStorage.setItem("access", response.data.tokens.access);
        localStorage.setItem("refresh", response.data.tokens.refresh);

        setSuccess("Registration successful! Redirecting to Dashboard...");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center" style={{ background: "linear-gradient(to right, #4f46e5, #3b82f6)" }}>
      <div className="card p-4 shadow-lg" style={{ maxWidth: "450px", width: "100%" }}>
        <h2 className="text-center fw-bold text-primary mb-4">Register</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" name="username" className="form-control" value={formData.username} onChange={handleChange} placeholder="Enter your username" />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} placeholder="Enter your email" />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} placeholder="Enter your password" />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" />
          </div>
          <button type="submit" className="btn btn-primary w-100 mt-3 btn-animated">Register</button>
        </form>

        <p className="mt-3 text-center text-muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
