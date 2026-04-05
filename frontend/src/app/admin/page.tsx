'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Shield, Lock, Bell, User as UserIcon } from 'lucide-react';

interface User {
    id: string;
    email: string;
    role: string;
    plan: string;
    monthly_quota: number;
    messages_sent_month: number;
    created_at: string;
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'users' | 'security' | 'smtp'>('users');
    const { logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.replace('/auth/login');
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/users');
                setUsers(response.data);
            } catch (err: any) {
                console.error('Error fetching users:', err);
                setError(err.response?.data?.detail || 'Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Link href="/dashboard" className="text-blue-400 hover:underline">Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">OwlTP Admin</h2>
                    <div className="flex gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>
                        <Link href="/admin/plans" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <Shield size={18} />
                            Manage Plans
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-mono">admin@owltp.com</span>
                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white"
                    >
                        <LogOut size={14} className="transition-transform group-hover:scale-110" />
                        Logout
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Panel</h1>
                        <p className="text-slate-400">System management and active defense monitoring.</p>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-lg border border-emerald-500/20 text-sm font-bold">
                        System Online
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-sm text-slate-400 mb-1">Total Users</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-sm text-slate-400 mb-1">Enterprise Users</p>
                        <p className="text-2xl font-bold">{users.filter(u => u.plan === 'enterprise').length}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-sm text-slate-400 mb-1">Active Guards</p>
                        <p className="text-2xl font-bold text-emerald-400">V99 Active</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-slate-800">
                    <button onClick={() => setView('users')} className={`pb-3 px-1 text-sm font-bold transition-all flex items-center gap-2 ${view === 'users' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-white'}`}>
                        <UserIcon size={16} /> Users
                    </button>
                    <button onClick={() => setView('security')} className={`pb-3 px-1 text-sm font-bold transition-all flex items-center gap-2 ${view === 'security' ? 'text-red-400 border-b-2 border-red-400' : 'text-slate-500 hover:text-white'}`}>
                        <Shield size={16} /> Security Radar
                    </button>
                    <button onClick={() => setView('smtp')} className={`pb-3 px-1 text-sm font-bold transition-all flex items-center gap-2 ${view === 'smtp' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}>
                        <Bell size={16} /> SMTP
                    </button>
                </div>

                {view === 'users' && <UserTable users={users} />}
                {view === 'security' && <SecurityRadar />}
                {view === 'smtp' && <SmtpSettingsPanel />}
            </div>
        </div>
    );
}

function UserTable({ users }: { users: User[] }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-800/50">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usage</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4">
                                <p className="font-medium">{user.email}</p>
                                <p className="text-xs text-slate-500">{user.id}</p>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                    {user.role.toUpperCase()}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.plan === 'enterprise' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-700 text-slate-300'}`}>
                                    {user.plan.toUpperCase()}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-sm">
                                    {user.messages_sent_month} / {user.monthly_quota === 0 ? '∞' : user.monthly_quota}
                                </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                                {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => window.location.href = `/admin/users/${user.id}`}
                                    className="text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 text-xs transition-colors"
                                >
                                    Manage
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SecurityRadar() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/security/stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleUnban = async (ip: string) => {
        try {
            await api.delete(`/admin/security/bans/${ip}`);
            fetchStats();
        } catch (err) { alert("Failed to unban"); }
    };

    if (loading) return <div className="animate-pulse h-40 bg-slate-900 rounded-xl" />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                        <Shield size={20} /> Active IP Bans ({stats?.banned_ips?.length || 0})
                    </h3>
                    <div className="space-y-3">
                        {stats?.banned_ips?.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No IPs currently restricted.</p>
                        ) : stats?.banned_ips?.map((b: any) => (
                            <div key={b.ip} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-red-500/10">
                                <div>
                                    <p className="text-sm font-mono text-white">{b.ip}</p>
                                    <p className="text-[10px] text-slate-500">TTL: {Math.floor(b.ttl / 60)}m {b.ttl % 60}s</p>
                                </div>
                                <button onClick={() => handleUnban(b.ip)} className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-all">UNBAN</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2">
                        <Lock size={20} /> Recent Threat Events (Threshold: {stats?.threshold})
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                        {stats?.recent_threats?.map((t: any) => (
                            <div key={t.id} className="text-xs p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <span className="text-red-400 font-bold">{t.action}</span>
                                    <span className="text-slate-500">{new Date(t.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-400">IP: <span className="font-mono">{t.ip_address}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SmtpSettingsPanel() {
    const [smtp, setSmtp] = useState({
        smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '', from_email: ''
    });
    const [smtpLoading, setSmtpLoading] = useState(true);
    const [smtpMsg, setSmtpMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        api.get('/admin/smtp').then(res => {
            setSmtp(res.data);
            setSmtpLoading(false);
        }).catch(() => setSmtpLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSmtpMsg({ type: 'info', text: 'جارٍ الحفظ...' });
        try {
            const res = await api.post('/admin/smtp', smtp);
            setSmtp(res.data);
            setSmtpMsg({ type: 'success', text: 'تم حفظ إعدادات SMTP ✓' });
        } catch {
            setSmtpMsg({ type: 'error', text: 'فشل حفظ الإعدادات' });
        }
    };

    const handleTest = async () => {
        setSmtpMsg({ type: 'info', text: 'جارٍ إرسال رسالة اختبار...' });
        try {
            const res = await api.post('/admin/smtp/test', smtp);
            setSmtpMsg({ type: 'success', text: res.data.message });
        } catch (err: any) {
            setSmtpMsg({ type: 'error', text: err?.response?.data?.detail || 'فشل الاختبار' });
        }
    };

    if (smtpLoading) return <div className="animate-pulse h-40 bg-slate-900 rounded-xl" />;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Shield size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">إعدادات SMTP</h2>
                    <p className="text-slate-400 text-xs">لإرسال إشعارات البريد الإلكتروني عند فشل OTP</p>
                </div>
            </div>

            {smtpMsg.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm border ${smtpMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        smtpMsg.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>{smtpMsg.text}</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">SMTP Host</label>
                        <input value={smtp.smtp_host} onChange={e => setSmtp({ ...smtp, smtp_host: e.target.value })}
                            placeholder="smtp.gmail.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">SMTP Port</label>
                        <input type="number" value={smtp.smtp_port} onChange={e => setSmtp({ ...smtp, smtp_port: Number(e.target.value) })}
                            placeholder="587"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">SMTP Username</label>
                        <input value={smtp.smtp_user} onChange={e => setSmtp({ ...smtp, smtp_user: e.target.value })}
                            placeholder="user@gmail.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">SMTP Password</label>
                        <input type="password" value={smtp.smtp_password} onChange={e => setSmtp({ ...smtp, smtp_password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-slate-400 font-medium">From Email</label>
                        <input value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })}
                            placeholder="noreply@owltp.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="submit"
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all">
                        حفظ الإعدادات
                    </button>
                    <button type="button" onClick={handleTest}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2 rounded-lg text-sm font-medium transition-all border border-slate-700">
                        اختبار الاتصال
                    </button>
                </div>
            </form>
        </div>
    );
}
