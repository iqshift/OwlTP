"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setToken, setUser, token } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = window.localStorage.getItem("auth_token");
      if (existing && !token) {
        setToken(existing);
        api
          .get("/me")
          .then((res) => {
            setUser(res.data);
            router.replace("/dashboard");
          })
          .catch(() => {
            setToken(null);
          });
      }
    }
  }, [router, setToken, setUser, token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      const accessToken = res.data.access_token as string;
      setToken(accessToken);
      const me = await api.get("/me");
      setUser(me.data);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('login_failed', "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl relative">
        {/* Owl Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-36 h-36 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-xl shadow-green-500/10 mb-4 overflow-hidden">
            <Image src="/owl-mascot.png" alt="OwlTP" width={144} height={144} className="object-contain w-full h-full scale-110 drop-shadow-lg" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            <span className="text-green-500">O</span>
            <span className="text-white">wl</span>
            <span className="text-green-500">TP</span>
          </span>
          <span className="text-xs text-slate-500 mt-1">WhatsApp OTP Platform</span>
        </div>

        <h1 className="mb-2 text-2xl font-bold">{t('login_title', 'Sign in')}</h1>
        <p className="mb-6 text-sm text-slate-400">
          {t('login_desc', 'Access your WhatsApp OTP dashboard.')}
        </p>
        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              {t('login_email_label', 'Email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              {t('login_password_label', 'Password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? t('login_button_loading', "Signing in...") : t('login_button', "Sign in")}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          {t('login_footer_text', "Don't have an account?")}{" "}
          <Link href="/auth/register" className="text-green-400 hover:underline">
            {t('login_footer_link', 'Sign up')}
          </Link>
        </p>
      </div>
    </main>
  );
}

