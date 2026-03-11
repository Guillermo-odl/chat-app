import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/api/auth/userinfo");
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post("/api/auth/login", { email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const signup = async (email, password) => {
    const res = await apiClient.post("/api/auth/signup", { email, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await apiClient.post("/api/auth/logout");
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await apiClient.post("/api/auth/update-profile", data);
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
