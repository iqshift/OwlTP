"use client";

import axios from "axios";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // CRITICAL: ONLY set session token if NO Authorization header is manually provided
    // This allows the Send Test Message page to use its own API Token.
    if (!config.headers.Authorization) {
      const token = window.localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// Response interceptor to handle authentication errors (expired tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized (expired token), clear local storage and redirect to login
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        // Only redirect if NOT already on the login/signup page to avoid loops
        if (!window.location.pathname.includes("/auth")) {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

