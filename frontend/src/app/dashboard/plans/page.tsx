"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Check, Loader2, Zap, Shield, Star } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Plan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    is_featured: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const { t } = useTranslation();

    const handleUpgrade = async (planName: string) => {
        setUpgrading(planName);
        try {
            await api.post(`/api/user/upgrade?plan_name=${planName.toLowerCase()}`);
            alert(`Successfully upgraded to ${planName}! Please refresh or check your dashboard.`);
            window.location.reload();
        } catch (err) {
            console.error("Upgrade failed:", err);
            alert("Upgrade failed. Please try again later.");
        } finally {
            setUpgrading(null);
        }
    };

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={48} className="text-green-500 animate-spin mb-4" />
                <p className="text-slate-500 animate-pulse font-medium tracking-widest uppercase text-xs">
                    {t('common_loading_plans', 'Loading Plans...')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">Subscription Plans</h1>
                <p className="text-slate-400">Choose the perfect plan for your business needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                {plans.map((p) => (
                    <div
                        key={p.id}
                        className={`relative p-8 rounded-3xl border transition-all duration-300 hover:translate-y-[-8px] ${p.is_featured
                            ? "bg-slate-900 border-green-500/50 shadow-2xl shadow-green-500/10"
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                            }`}
                    >
                        {p.is_featured && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                <Star size={10} fill="currentColor" />
                                Most Popular
                            </span>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                            <p className="text-slate-500 text-sm mb-6 h-10 line-clamp-2">{p.description}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">{p.price}</span>
                                {p.price.includes('$') && <span className="text-slate-500 text-sm">/month</span>}
                            </div>
                        </div>

                        <div className="h-px bg-slate-800 mb-6 w-full opacity-50"></div>

                        <ul className="space-y-4 mb-8">
                            {p.features.map(f => (
                                <li key={f} className="flex items-start gap-3 text-slate-300 text-sm">
                                    <div className="mt-1 p-0.5 rounded-full bg-green-500/10">
                                        <Check size={14} className="text-green-500" />
                                    </div>
                                    <span className="leading-tight">{f}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            disabled={upgrading !== null}
                            onClick={() => handleUpgrade(p.name)}
                            className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${upgrading === p.name ? "opacity-70" : ""
                                } ${p.is_featured
                                    ? "bg-green-500 text-slate-950 hover:bg-green-400 shadow-green-500/10"
                                    : "bg-slate-800 text-white hover:bg-slate-700 shadow-black/20"
                                }`}
                        >
                            {upgrading === p.name ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                `Select ${p.name}`
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Support section */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-white">Need a custom plan?</h4>
                        <p className="text-slate-400">Contact our sales team for tailored enterprise solutions.</p>
                    </div>
                </div>
                <button className="bg-slate-950 border border-slate-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                    Contact Sales
                </button>
            </div>
        </div>
    );
}
