"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Zap, Shield, Smartphone, Globe, Code, Loader2, Menu, X, ChevronDown } from "lucide-react";
import api from "@/lib/api";

import { useTranslation } from "@/hooks/useTranslation";

import { Navbar } from "@/components/Navbar";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  is_featured: boolean;
}

export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useTranslation();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/api/plans");
        setPlans(response.data);
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-green-500/30 font-sans">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8 animate-bounce">
              <Zap size={14} className="text-green-500" />
              <span className="text-[10px] md:text-xs font-bold text-green-500 uppercase tracking-widest">{t('hero_badge', 'New: Multi-language SDKs support')}</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 md:mb-8 leading-[1.2] md:leading-[1.1] tracking-tight">
              {t('hero_title_1', 'Send OTPs via')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">{t('hero_title_2', 'WhatsApp')}</span>
            </h1>

            <p className="max-w-2xl mx-auto text-base md:text-xl text-slate-400 mb-8 md:mb-12 leading-relaxed">
              {t('hero_desc', 'Scalable, reliable, and production-ready API for your business.')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
              <Link href="/auth/register" className="bg-green-500 text-slate-950 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-lg hover:bg-green-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-green-500/20">
                {t('hero_cta_trial', 'Start Free Trial')}
              </Link>
              <Link href="/docs" className="bg-slate-900 border border-slate-800 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all">
                {t('hero_cta_docs', 'View API Docs')}
              </Link>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-green-500/10 rounded-full blur-[80px] md:blur-[120px] -z-10"></div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t('feat_section_title', 'Everything you need to scale')}</h2>
              <p className="text-slate-400">{t('feat_section_desc', 'Built for developers who demand speed and reliability.')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
              {[
                { title: "Global Delivery", desc: "Send messages to any WhatsApp user globally with 99.9% uptime.", icon: Globe, color: "text-blue-500" },
                { title: "Developer First", icon: Code, color: "text-green-500", desc: "Easy to integrate SDKs for Python, JS, PHP, and Java." },
                { title: "Enterprise Security", icon: Shield, color: "text-purple-500", desc: "End-to-end encryption and secure API token management." },
              ].map((f) => (
                <div key={f.title} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-green-500/30 transition-all group">
                  <div className={`w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.color}`}>
                    <f.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-slate-900/20 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{t('price_section_title', 'Simple, transparent pricing')}</h2>
              <p className="text-slate-400">{t('price_section_desc', 'Choose the plan that fits your growth.')}</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <Loader2 size={48} className="text-green-500 animate-spin mb-4" />
                <p className="text-slate-500 animate-pulse font-medium tracking-widest uppercase text-xs">{t('common_loading_plans', 'Loading Plans...')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((p) => (
                  <div key={p.id} className={`relative p-10 rounded-3xl border ${p.is_featured ? "bg-slate-900 border-green-500/50 shadow-2xl shadow-green-500/10 scale-105 z-10" : "bg-slate-950/50 border-slate-800"}`}>
                    {p.is_featured && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Most Popular</span>}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                      <p className="text-slate-500 text-sm mb-6">{p.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{p.price}</span>
                        {p.price.includes('$') && <span className="text-slate-500 text-sm">/month</span>}
                      </div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                          <Check size={16} className="text-green-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/register" className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${p.is_featured ? "bg-green-500 text-slate-950 hover:bg-green-400" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                      Get Started
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-10 text-green-500">
              <Shield size={40} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">{t('about_title', 'About OwlTP')}</h2>
            <p className="text-xl text-slate-400 leading-relaxed mb-12">
              {t('about_desc', 'OwlTP was founded with a single mission: to provide the most reliable and affordable WhatsApp OTP gateway in the market. We believe that secure authentication shouldnt be expensive or complicated.')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div><p className="text-2xl font-bold text-white">99.9%</p><p className="text-sm text-slate-500">Uptime</p></div>
              <div><p className="text-2xl font-bold text-white">200+</p><p className="text-sm text-slate-500">Countries</p></div>
              <div><p className="text-2xl font-bold text-white">1M+</p><p className="text-sm text-slate-500">Sent API</p></div>
              <div><p className="text-2xl font-bold text-white">24/7</p><p className="text-sm text-slate-500">Monitoring</p></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-500 font-bold">O</span>
            </div>
            <span className="font-bold text-white">OwlTP</span>
          </div>
          <p>{t('footer_rights', '© 2026 OwlTP Platform. All rights reserved.')}</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div >
  );
}

