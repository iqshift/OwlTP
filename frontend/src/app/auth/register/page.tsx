"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setToken, setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/register", { name, email, password });
      const loginRes = await api.post("/auth/login", { email, password });
      setToken(loginRes.data.access_token);
      const me = await api.get("/me");
      setUser(me.data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('reg_failed', "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl animate-in fade-in zoom-in duration-300 relative">
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

        <h1 className="mb-2 text-2xl font-bold text-white">{t('reg_title', 'Create an account')}</h1>
        <p className="mb-6 text-sm text-slate-400">
          {t('reg_desc', 'Start sending OTPs via WhatsApp today.')}
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ps-1">
              {t('reg_name_label', 'Full Name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ps-1">
              {t('reg_email_label', 'Email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ps-1">
              {t('reg_password_label', 'Password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded-xl bg-green-500 py-3.5 text-sm font-black text-slate-950 hover:bg-green-400 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-green-500/20"
          >
            {loading ? t('reg_button_loading', "Creating Account...") : t('reg_button', "Create Account")}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500 font-medium tracking-wide">
          {t('reg_footer_text', 'Already have an account?')}{" "}
          <Link href="/auth/login" className="text-green-500 hover:underline font-bold">
            {t('reg_footer_link', 'Sign in')}
          </Link>
        </p>
      </div>
    </main>
  );
}
