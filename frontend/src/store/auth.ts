"use client";

import { create } from "zustand";

type User = {
  id: string;
  email: string;
  role: string;
  plan: string;
  monthly_quota: number;
  messages_sent_month: number;
  otp_template: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) {
        window.localStorage.setItem("auth_token", token);
      } else {
        window.localStorage.removeItem("auth_token");
      }
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token");
    }
    set({ token: null, user: null });
  },
}));

