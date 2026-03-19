"use client";

import { useState, FormEvent } from "react";
import { User, Shield, Bell, CreditCard, Save, Lock, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

type Tab = "General" | "Security" | "Notifications" | "Billing";

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>("General");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // General tab state
    const [otpTemplate, setOtpTemplate] = useState((user as any)?.otp_template || "كود التحقق الخاص بك هو: ");
    const [greetingText, setGreetingText] = useState((user as any)?.greeting_text || "مرحبا");

    // Security tab state
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });

    // Notifications tab state
    const [notifyOnFail, setNotifyOnFail] = useState((user as any)?.notify_on_fail === "true");
    const [notifyEmail, setNotifyEmail] = useState((user as any)?.notify_email || user?.email || "");

    const showMsg = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    // ── Handlers ──────────────────────────────────────────
    const handleUpdateTemplate = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/api/settings", {
                otp_template: otpTemplate,
                greeting_text: greetingText,
            });
            setUser(res.data);
            showMsg("success", "تم حفظ الإعدادات بنجاح ✓");
        } catch {
            showMsg("error", "فشل حفظ الإعدادات");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showMsg("error", "كلمتا المرور غير متطابقتين");
            return;
        }
        if (passwordData.new.length < 6) {
            showMsg("error", "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
            return;
        }
        setLoading(true);
        try {
            await api.post("/api/settings/password", {
                current_password: passwordData.current,
                new_password: passwordData.new,
            });
            setPasswordData({ current: "", new: "", confirm: "" });
            showMsg("success", "تم تغيير كلمة المرور بنجاح ✓");
        } catch (err: any) {
            showMsg("error", err?.response?.data?.detail || "فشل تغيير كلمة المرور");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateNotifications = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/api/settings/notifications", {
                notify_on_fail: notifyOnFail ? "true" : "false",
                notify_email: notifyEmail,
            });
            setUser(res.data);
            showMsg("success", "تم حفظ إعدادات الإشعارات ✓");
        } catch {
            showMsg("error", "فشل حفظ الإشعارات");
        } finally {
            setLoading(false);
        }
    };

    // ── Tabs Config ───────────────────────────────────────
    const tabs: { name: Tab; icon: any }[] = [
        { name: "General", icon: User },
        { name: "Security", icon: Shield },
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
                                    <label className="text-sm font-medium text-slate-400">النص الترحيبي</label>
                                    <input
                                        type="text"
                                        value={greetingText}
                                        onChange={(e) => setGreetingText(e.target.value)}
                                        placeholder="مرحبا"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-sm"
                                    />
                                    <p className="text-xs text-slate-500">مثال: مرحبا، Hi، Hello — سيُضاف اسم المستلم بعده تلقائياً</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">نص الرسالة</label>
                                    <textarea
                                        value={otpTemplate}
                                        onChange={(e) => setOtpTemplate(e.target.value)}
                                        rows={2}
                                        placeholder="كود التحقق الخاص بك هو: "
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-mono text-sm"
                                    />
                                </div>

                                {/* Preview */}
                                <div className="rounded-xl bg-slate-950 border border-slate-700 p-4">
                                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">معاينة الرسالة</p>
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-white font-mono whitespace-pre-line leading-relaxed">
                                        {greetingText ? `${greetingText} أحمد\n${otpTemplate}\n123456` : `${otpTemplate}\n123456`}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-green-500/20 disabled:opacity-60">
                                    <Save size={16} />
                                    حفظ الإعدادات
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
                                <h2 className="text-xl font-semibold text-white">تغيير كلمة المرور</h2>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">كلمة المرور الحالية</label>
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
                                        <label className="text-sm font-medium text-slate-400">كلمة المرور الجديدة</label>
                                        <input
                                            type="password"
                                            value={passwordData.new}
                                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">تأكيد كلمة المرور</label>
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
                                    تغيير كلمة المرور
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
                                <h2 className="text-xl font-semibold text-white">إعدادات الإشعارات</h2>
                            </div>

                            <form onSubmit={handleUpdateNotifications} className="space-y-6">
                                {/* Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <div>
                                        <p className="text-white font-medium text-sm">إشعار عند فشل الإرسال</p>
                                        <p className="text-slate-500 text-xs mt-1">استلم بريد إلكتروني عند فشل رسالة OTP</p>
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
                                        <label className="text-sm font-medium text-slate-400">البريد الإلكتروني للإشعارات</label>
                                        <input
                                            type="email"
                                            value={notifyEmail}
                                            onChange={(e) => setNotifyEmail(e.target.value)}
                                            placeholder={user?.email || ""}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                                        />
                                        <p className="text-xs text-slate-500">سيُرسل الإشعار لهذا البريد عند كل فشل</p>
                                    </div>
                                )}

                                <button type="submit" disabled={loading}
                                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-60">
                                    <Save size={16} />
                                    حفظ الإشعارات
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
                                <h2 className="text-xl font-semibold text-white">الفوترة والخطة</h2>
                            </div>
                            <div className="text-center py-12 text-slate-500">
                                <CreditCard size={40} className="mx-auto mb-4 opacity-30" />
                                <p className="text-sm">إدارة الفوترة ستكون متاحة قريباً</p>
                                <p className="text-xs mt-1 opacity-60">خطتك الحالية: <span className="text-white font-bold capitalize">{(user as any)?.plan || "free"}</span></p>
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
}
