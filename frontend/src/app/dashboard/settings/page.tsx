"use client";

import { useState, FormEvent } from "react";
import { User, Shield, Bell, CreditCard, Save, Lock, MessageSquare, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

type Tab = "General" | "Security" | "Protection" | "Notifications" | "Billing";

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>("General");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // General tab state
    const [otpTemplate, setOtpTemplate] = useState((user as any)?.otp_template || "Your verification code is: ");
    const [greetingText, setGreetingText] = useState((user as any)?.greeting_text || "Hello");

    // Security tab state
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });

    // Notifications tab state
    const [notifyOnFail, setNotifyOnFail] = useState((user as any)?.notify_on_fail === "true");
    const [notifyEmail, setNotifyEmail] = useState((user as any)?.notify_email || user?.email || "");

    // Protection tab state
    const [accountProtection, setAccountProtection] = useState((user as any)?.account_protection === "true");
    const [interactionStrategy, setInteractionStrategy] = useState((user as any)?.interaction_strategy === "true");
    const [sleepCycles, setSleepCycles] = useState((user as any)?.sleep_cycles === "true");
    const [spintaxEnabled, setSpintaxEnabled] = useState((user as any)?.spintax_enabled === "true");
    const [smartRotation, setSmartRotation] = useState((user as any)?.smart_rotation === "true");
    
    // New Advanced Protection fields
    const [interactionQuestion, setInteractionQuestion] = useState((user as any)?.interaction_question || "Hello {name}, did you request an OwlTP verification code? Reply with (Yes) to receive it.");
    const [interactionKeywords, setInteractionKeywords] = useState((user as any)?.interaction_keywords || "yes,ok,confirm,yep,yeah,y,sure");
    const [spintax1, setSpintax1] = useState((user as any)?.spintax_1 || "Hello {name}, your code is: {code}");
    const [spintax2, setSpintax2] = useState((user as any)?.spintax_2 || "OTP: {code} is your verification code. Do not share it.");
    const [spintax3, setSpintax3] = useState((user as any)?.spintax_3 || "Your login code is {code}. Thank you for using OwlTP.");

    const showMsg = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    // ── Handlers ──────────────────────────────────────────
    const handleUpdateTemplate = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/settings", {
                otp_template: otpTemplate,
                greeting_text: greetingText,
            });
            setUser(res.data);
            showMsg("success", "Settings saved successfully ✓");
        } catch {
            showMsg("error", "Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showMsg("error", "Passwords do not match");
            return;
        }
        if (passwordData.new.length < 6) {
            showMsg("error", "New password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            await api.post("/settings/password", {
                current_password: passwordData.current,
                new_password: passwordData.new,
            });
            setPasswordData({ current: "", new: "", confirm: "" });
            showMsg("success", "Password changed successfully ✓");
        } catch (err: any) {
            showMsg("error", err?.response?.data?.detail || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateNotifications = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/settings", {
                notify_on_fail: notifyOnFail ? "true" : "false",
                notify_email: notifyEmail,
            });
            setUser(res.data);
            showMsg("success", "Notification settings saved ✓");
        } catch {
            showMsg("error", "Failed to save notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProtection = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/settings", {
                account_protection: accountProtection ? "true" : "false",
                interaction_strategy: interactionStrategy ? "true" : "false",
                sleep_cycles: sleepCycles ? "true" : "false",
                spintax_enabled: spintaxEnabled ? "true" : "false",
                smart_rotation: smartRotation ? "true" : "false",
                interaction_question: interactionQuestion,
                interaction_keywords: interactionKeywords,
                spintax_1: spintax1,
                spintax_2: spintax2,
                spintax_3: spintax3,
            });
            setUser(res.data);
            showMsg("success", "Protection settings saved successfully ✓");
        } catch {
            showMsg("error", "Failed to save protection settings");
        } finally {
            setLoading(false);
        }
    };

    // ── Tabs Config ───────────────────────────────────────
    const tabs: { name: Tab; icon: any }[] = [
        { name: "General", icon: User },
        { name: "Protection", icon: Shield },
        { name: "Security", icon: Lock },
        { name: "Notifications", icon: Bell },
        { name: "Billing", icon: CreditCard },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-slate-400">Manage your account preferences and security settings.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${message.type === "success" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    message.type === "error" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                    <span>{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Tabs */}
                <div className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center gap-3 shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.name
                                ? "bg-green-500 text-slate-950 shadow-lg shadow-green-500/20"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-6">

                    {/* ── GENERAL TAB ── */}
                    {activeTab === "General" && (
                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                    <MessageSquare size={20} />
                                </div>
                                <h2 className="text-xl font-semibold text-white">OTP Message Template</h2>
                            </div>

                            <form onSubmit={handleUpdateTemplate} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Greeting Text</label>
                                    <input
                                        type="text"
                                        value={greetingText}
                                        onChange={(e) => setGreetingText(e.target.value)}
                                        placeholder="Hello"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-sm"
                                    />
                                    <p className="text-xs text-slate-500">Example: Hi, Hello, Welcome — Name will be added automatically.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Default Template</label>
                                    <textarea
                                        value={otpTemplate}
                                        onChange={(e) => setOtpTemplate(e.target.value)}
                                        rows={2}
                                        placeholder="Your verification code is: "
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-mono text-sm"
                                    />
                                </div>

                                {/* Preview */}
                                <div className="rounded-xl bg-slate-950 border border-slate-700 p-4">
                                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Message Preview</p>
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-white font-mono whitespace-pre-line leading-relaxed">
                                        {greetingText ? `${greetingText} John\n${otpTemplate}\n123456` : `${otpTemplate}\n123456`}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-green-500/20 disabled:opacity-60">
                                    <Save size={16} />
                                    Save General Settings
                                </button>
                            </form>
                        </section>
                    )}

                    {/* ── PROTECTION TAB ── */}
                    {activeTab === "Protection" && (
                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                    <Shield size={20} />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Account Protection (Anti-Ban)</h2>
                            </div>
                            <p className="text-sm text-slate-400 mb-6">
                                Advanced tactics to bypass ban algorithms and protect your number from spam detection.
                            </p>

                            <form onSubmit={handleUpdateProtection} className="space-y-6">
                                {/* Toggles Block */}
                                <div className="space-y-4">
                                    {/* Account Protection Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex gap-4 items-start">
                                            <div className="mt-1 p-1.5 bg-blue-500/10 rounded text-blue-400">
                                                <Shield size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">Human Emulation</p>
                                                <p className="text-slate-500 text-xs mt-1">Random delays, simulated typing, and invisible message variation.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setAccountProtection(!accountProtection)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${accountProtection ? "bg-green-500" : "bg-slate-700"}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${accountProtection ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                    </div>

                                    {/* Interaction Strategy Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 border-l-purple-500/30 border-l-4">
                                        <div className="flex gap-4 items-start">
                                            <div className="mt-1 p-1.5 bg-purple-500/10 rounded text-purple-400">
                                                <MessageSquare size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">Interaction Strategy</p>
                                                <p className="text-slate-500 text-xs mt-1">Send a confirmation question first. Only sends code after user replies. (Safest)</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setInteractionStrategy(!interactionStrategy)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${interactionStrategy ? "bg-green-500" : "bg-slate-700"}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${interactionStrategy ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                    </div>

                                    {/* Sleep Cycles Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex gap-4 items-start">
                                            <div className="mt-1 p-1.5 bg-yellow-500/10 rounded text-yellow-400">
                                                <Lock size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">Sleep Cycles</p>
                                                <p className="text-slate-500 text-xs mt-1">Automatically pauses sending during typical sleep hours (2 AM - 7 AM).</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSleepCycles(!sleepCycles)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${sleepCycles ? "bg-green-500" : "bg-slate-700"}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${sleepCycles ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                    </div>

                                    {/* Spintax Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 border-l-orange-500/30 border-l-4">
                                        <div className="flex gap-4 items-start">
                                            <div className="mt-1 p-1.5 bg-orange-500/10 rounded text-orange-400">
                                                <Save size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">Spintax (Message Variation)</p>
                                                <p className="text-slate-500 text-xs mt-1">Rotates between 3 different message templates to avoid pattern detection.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSpintaxEnabled(!spintaxEnabled)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${spintaxEnabled ? "bg-green-500" : "bg-slate-700"}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${spintaxEnabled ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                    </div>

                                    {/* Smart Strategy Rotation Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 ring-1 ring-green-500/20">
                                        <div className="flex gap-4 items-start">
                                            <div className="mt-1 p-1.5 bg-green-500/10 rounded text-green-400">
                                                <RefreshCw size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">Smart Strategy Rotation</p>
                                                <p className="text-slate-500 text-xs mt-1">Automatically alternates protection strategies to keep your traffic randomized.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSmartRotation(!smartRotation)}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${smartRotation ? "bg-green-500" : "bg-slate-700"}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${smartRotation ? "translate-x-6" : "translate-x-0"}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Templates Section */}
                                <div className="space-y-6 pt-4 border-t border-slate-800 animate-in slide-in-from-bottom-2 duration-500">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <MessageSquare size={18} className="text-green-400" />
                                        Custom Templates & Keywords
                                    </h3>

                                    {/* Custom Interaction Question */}
                                    {interactionStrategy && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 rounded-xl border border-purple-500/10">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">Interaction Question</label>
                                                <textarea
                                                    value={interactionQuestion}
                                                    onChange={(e) => setInteractionQuestion(e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                                                    placeholder="Hello {name}, did you request a code?"
                                                />
                                                <p className="text-[10px] text-slate-500">Supports <span className="text-purple-400">{`{name}`}</span> placeholder.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">Confirmation Keywords</label>
                                                <input
                                                    type="text"
                                                    value={interactionKeywords}
                                                    onChange={(e) => setInteractionKeywords(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                                                    placeholder="yes,ok,confirm,yep"
                                                />
                                                <p className="text-[10px] text-slate-500">Comma-separated list of words that trigger the OTP release.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Spintax Variations */}
                                    {spintaxEnabled && (
                                        <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-orange-500/10">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-slate-300">Spintax Variations</label>
                                                <span className="text-[10px] text-slate-500 italic">Supports {`{name}`} and {`{code}`} placeholders</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <textarea
                                                    value={spintax1}
                                                    onChange={(e) => setSpintax1(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:ring-1 focus:ring-orange-500/50"
                                                    placeholder="Variation 1"
                                                />
                                                <textarea
                                                    value={spintax2}
                                                    onChange={(e) => setSpintax2(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:ring-1 focus:ring-orange-500/50"
                                                    placeholder="Variation 2"
                                                />
                                                <textarea
                                                    value={spintax3}
                                                    onChange={(e) => setSpintax3(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:ring-1 focus:ring-orange-500/50"
                                                    placeholder="Variation 3"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 px-8 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-green-500/20 disabled:opacity-60">
                                    <Save size={16} />
                                    Save Protection Suite
                                </button>
                            </form>
                        </section>
                    )}

                    {/* ── SECURITY TAB ── */}
                    {activeTab === "Security" && (
                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Lock size={20} />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Change Password</h2>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.current}
                                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.new}
                                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirm}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-purple-500/20 disabled:opacity-60">
                                    <Lock size={16} />
                                    Update Password
                                </button>
                            </form>
                        </section>
                    )}

                    {/* ── NOTIFICATIONS TAB ── */}
                    {activeTab === "Notifications" && (
                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Bell size={20} />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Notifications</h2>
                            </div>

                            <form onSubmit={handleUpdateNotifications} className="space-y-6">
                                {/* Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div>
                                        <p className="text-white font-medium text-sm">Failure Notifications</p>
                                        <p className="text-slate-500 text-xs mt-1">Receive an email if an OTP delivery fails.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotifyOnFail(!notifyOnFail)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notifyOnFail ? "bg-green-500" : "bg-slate-700"
                                            }`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${notifyOnFail ? "translate-x-6" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>

                                {/* Notification Email */}
                                {notifyOnFail && (
                                    <div className="space-y-2 animate-in fade-in duration-300">
                                        <label className="text-sm font-medium text-slate-400">Notification Email</label>
                                        <input
                                            type="email"
                                            value={notifyEmail}
                                            onChange={(e) => setNotifyEmail(e.target.value)}
                                            placeholder={user?.email || ""}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                                        />
                                    </div>
                                )}

                                <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-60">
                                    <Save size={16} />
                                    Save Notification Rules
                                </button>
                            </form>
                        </section>
                    )}

                    {/* ── BILLING TAB ── */}
                    {activeTab === "Billing" && (
                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                                    <CreditCard size={20} />
                                </div>
                                <h2 className="text-xl font-semibold text-white">Billing & Plan</h2>
                            </div>
                            <div className="text-center py-12 text-slate-500">
                                <CreditCard size={40} className="mx-auto mb-4 opacity-30" />
                                <p className="text-sm">Billing management coming soon</p>
                                <p className="text-xs mt-1 opacity-60">Current Plan: <span className="text-white font-bold capitalize">{(user as any)?.plan || "free"}</span></p>
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
}

