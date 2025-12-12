// // context/AuthContext.jsx
// import React, { createContext, useContext, useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const AuthContext = createContext();
// export const useAuth = () => useContext(AuthContext);

// axios.defaults.baseURL = "http://127.0.0.1:8000/api"; // <- point to Django dev server

// export const AuthProvider = ({ children }) => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const savedToken = localStorage.getItem("token");
//     const savedUser = localStorage.getItem("user");
//     if (savedToken && savedUser) {
//       setToken(savedToken);
//       setUser(JSON.parse(savedUser));
//       axios.defaults.headers.common["Authorization"] = `Token ${savedToken}`;
//     }
//     setLoading(false);
//   }, []);

//   const login = ({ token, user }) => {
//     setToken(token);
//     setUser(user);
//     localStorage.setItem("token", token);
//     localStorage.setItem("user", JSON.stringify(user));
//     axios.defaults.headers.common["Authorization"] = `Token ${token}`;
//   };

//   const signup = async ({ username, email, password }) => {
//     const res = await axios.post("/register/", { username, email, password });
//     // expects { token, user }
//     login({ token: res.data.token, user: res.data.user });
//   };

//   const logout = () => {
//     setToken(null);
//     setUser(null);
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     delete axios.defaults.headers.common["Authorization"];
//     navigate("/login");
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout, signup, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
