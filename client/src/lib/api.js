import axios from "axios";

// Base from env or local; strip trailing slashes
const RAW = import.meta.env.VITE_API_URL || "http://localhost:4000";
const BASE = RAW.replace(/\/+$/, "");

// Ensure exactly one '/api' segment at the end of baseURL
const BASE_API = /\/api(?:\/|$)/.test(BASE) ? BASE : `${BASE}/api`;

export const api = axios.create({
  baseURL: BASE_API,                // e.g. https://fitmate-m1mz.onrender.com/api
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Optional helper to set/remove token globally
export function setAuth(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

// Always attach token from localStorage if present
api.interceptors.request.use((config) => {
  // Avoid leading slash resetting the path (keeps '/api' in baseURL)
  if (config.url && config.url.startsWith("/")) {
    config.url = config.url.replace(/^\/+/, "");
  }

  const t = localStorage.getItem("fitmate_token");
  if (t && !config.headers?.Authorization) {
    config.headers = { ...config.headers, Authorization: `Bearer ${t}` };
  }
  return config;
});
