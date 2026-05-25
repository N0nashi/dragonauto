import React, { createContext, useState, useEffect, useCallback, useRef } from "react";

const API = import.meta.env.VITE_API_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  const refreshUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setUnreadCount(0); return; }
    try {
      const r = await fetch(`${API}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;
      const d = await r.json();
      setUnreadCount(d.count ?? 0);
    } catch { /* silently fail */ }
  }, []);

  /* Poll every 60s while logged in */
  useEffect(() => {
    if (isLoggedIn) {
      refreshUnreadCount();
      pollRef.current = setInterval(refreshUnreadCount, 60_000);
    } else {
      setUnreadCount(0);
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [isLoggedIn, refreshUnreadCount]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") setIsLoggedIn(!!e.newValue);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, unreadCount, refreshUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
};
