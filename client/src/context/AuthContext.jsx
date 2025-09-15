import React from "react";
import { api, setAuth } from "../lib/api";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [token, setToken] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("fitmate_token");
    if (!stored) return setLoading(false);
    setAuth(stored);
    setToken(stored);
    api.get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => {
        localStorage.removeItem("fitmate_token");
        setAuth(null);
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // IMPORTANT: fetch full user (with profile.isComplete) immediately after login
  async function login(email, password) {
    const r = await api.post("/auth/login", { email, password });
    const t = r.data.token;
    localStorage.setItem("fitmate_token", t);
    setAuth(t);
    setToken(t);
    const me = await api.get("/auth/me");
    setUser(me.data.user);
    return me.data.user;
  }

  async function register(name, email, password) {
    const r = await api.post("/auth/register", { name, email, password });
    const t = r.data.token;
    localStorage.setItem("fitmate_token", t);
    setAuth(t);
    setToken(t);
    setUser(r.data.user);
    return r.data.user;
  }

  function logout() {
    localStorage.removeItem("fitmate_token");
    setAuth(null);
    setUser(null);
    setToken(null);
  }
  async function refreshMe() {
    const r = await api.get("/auth/me");
    setUser(r.data.user);
    return r.data.user;
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, error, login, register, logout, setError, setUser, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
