'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LogOut, LayoutDashboard, ChevronLeft, MessageSquare, Users, User, Image as ImageIcon, Send, Clock, Search } from 'lucide-react';

interface UserDetail {
    id: string;
    email: string;
    role: string;
    plan: string;
    monthly_quota: number;
    messages_sent_month: number;
    sessions: any[];
    messages: any[];
}

export default function UserAdminPage() {
    const params = useParams();
    const userId = params.id;
    const router = useRouter();
    const { logout } = useAuthStore();

    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // WhatsApp Inspection State
    const [wsProfile, setWsProfile] = useState<any>(null);
    const [wsChats, setWsChats] = useState<any[]>([]);
    const [wsContacts, setWsContacts] = useState<any[]>([]);
    const [wsMessages, setWsMessages] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [wsLoading, setWsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'messages'>('chats');

    const [editData, setEditData] = useState({
        plan: '',
        monthly_quota: 0,
        role: ''
    });

    const handleLogout = () => {
        logout();
        router.replace('/auth/login');
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/admin/users/${userId}`);
                setUser(response.data);
                setEditData({
                    plan: response.data.plan,
                    monthly_quota: response.data.monthly_quota,
                    role: response.data.role
                });
            } catch (err) {
                console.error('Error fetching user:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchUser();
    }, [userId]);

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const response = await api.patch(`/admin/users/${userId}`, editData);
            setUser({ ...user!, ...response.data });
            alert('User updated successfully!');
        } catch (err) {
            alert('Failed to update user');
        } finally {
            setUpdating(false);
        }
    };

    const fetchWsProfile = async () => {
        setWsLoading(true);
        try {
            const resp = await api.get(`/admin/whatsapp/users/${userId}/profile`);
            // Merge DB session status into profile data
            const sessionStatus = user?.sessions?.[0]?.status || 'unknown';
            setWsProfile({ ...resp.data, status: sessionStatus });
            fetchWsChats();
        } catch (err) {
            console.error('Failed to fetch WS profile', err);
        } finally {
            setWsLoading(false);
        }
    };

    const fetchWsChats = async () => {
        try {
            const resp = await api.get(`/admin/whatsapp/users/${userId}/chats`);
            setWsChats(resp.data.data || []);
        } catch (err) {
            console.error('Failed to fetch WS chats', err);
        }
    };

    const triggerWsSync = async () => {
        setWsLoading(true);
        try {
            await api.post(`/admin/whatsapp/users/${userId}/sync`);
            // Give it a moment to start and then fetch profile again
            setTimeout(() => {
                fetchWsProfile();
            }, 2000);
        } catch (err) {
            alert('Failed to trigger sync');
            setWsLoading(false);
        }
    };

    const fetchWsContacts = async () => {
        try {
            const resp = await api.get(`/admin/whatsapp/users/${userId}/contacts`);
            setWsContacts(resp.data.data || []);
        } catch (err) {
            console.error('Failed to fetch WS contacts', err);
        }
    };

    const fetchWsMessages = async (chatJid: string) => {
        setWsLoading(true);
        setSelectedChat(chatJid);
        setActiveTab('messages');
        try {
            const resp = await api.get(`/admin/whatsapp/users/${userId}/messages?chat_jid=${chatJid}`);
            setWsMessages(resp.data.data || []);
        } catch (err) {
            console.error('Failed to fetch WS messages', err);
        } finally {
            setWsLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center bg-slate-950 text-white min-h-screen">Loading user details...</div>;
    if (!user) return <div className="p-8 text-center text-red-500 bg-slate-950 min-h-screen">User not found</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">OTP Admin</h2>
                    <div className="flex gap-4">
                        <Link href="/admin" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft size={18} />
                            Back to Users
                        </Link>
                        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <LayoutDashboard size={18} />
                            Dashboard
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

            <div className="space-y-8 p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-arabic">إدارة المستخدم</h1>
                        <p className="text-slate-400">{user.email}</p>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{user.id}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Edit Form */}
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
                        <h2 className="text-xl font-bold mb-4 font-arabic">إعدادات الحساب</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1 font-arabic">الخطة</label>
                                <select
                                    value={editData.plan}
                                    onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                                    className="w-full bg-slate-800 rounded-lg p-3 border border-slate-700 outline-none focus:border-emerald-500"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1 font-arabic">الرصيد الشهري (0 = غير محدود)</label>
                                <input
                                    type="number"
                                    value={editData.monthly_quota}
                                    onChange={(e) => setEditData({ ...editData, monthly_quota: parseInt(e.target.value) })}
                                    className="w-full bg-slate-800 rounded-lg p-3 border border-slate-700 outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1 font-arabic">الصلاحية (Role)</label>
                                <select
                                    value={editData.role}
                                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                    className="w-full bg-slate-800 rounded-lg p-3 border border-slate-700 outline-none focus:border-emerald-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 font-arabic"
                            >
                                {updating ? 'جاري التحديث...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                            <h2 className="text-lg font-bold mb-4 font-arabic">جلسات واتساب</h2>
                            {user.sessions?.length > 0 ? (
                                <div className="space-y-3">
                                    {user.sessions.map((session, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                                            <span className="text-sm">{session.device_id || 'Browser Session'}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${session.status === 'connected' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {session.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic text-sm font-arabic">لا توجد جلسات مرتبطة.</p>
                            )}
                        </div>

                        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                            <h2 className="text-lg font-bold mb-4 font-arabic">آخر الرسائل</h2>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {user.messages?.length > 0 ? user.messages.map((msg, idx) => (
                                    <div key={idx} className="text-xs border-b border-slate-800 pb-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">{msg.phone}</span>
                                            <span className={msg.status === 'sent' ? 'text-green-500' : 'text-red-500'}>{msg.status}</span>
                                        </div>
                                        <p className="truncate text-slate-300">{msg.message}</p>
                                    </div>
                                )) : <p className="text-slate-500 italic text-sm font-arabic">لا توجد رسائل مرسلة.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Inspector Section */}
                <div className="mt-12 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2 font-arabic">
                            <MessageSquare className="text-green-500" />
                            مفتش واتساب (Admin Only)
                        </h2>
                        {!wsProfile && (
                            <button
                                onClick={fetchWsProfile}
                                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold text-sm transition-all font-arabic"
                            >
                                جلب بيانات واتساب
                            </button>
                        )}
                    </div>

                    {wsProfile && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Profile Sidebar */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center">
                                    <div className="relative w-24 h-24 mx-auto mb-4 group">
                                        {wsProfile.picture_url ? (
                                            <img src={wsProfile.picture_url} className="w-full h-full rounded-full object-cover border-4 border-slate-800 shadow-xl" alt="Profile" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                                                <User size={40} className="text-slate-500" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 rounded-full bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h3 className="font-bold text-lg">{wsProfile.push_name || wsProfile.jid?.split('@')[0] || user.email}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1 break-all">{wsProfile.jid}</p>
                                    {/* Session Status Badge */}
                                    <span className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${wsProfile.status === 'connected'
                                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                        : wsProfile.status === 'disconnected'
                                            ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${wsProfile.status === 'connected' ? 'bg-green-400' :
                                            wsProfile.status === 'disconnected' ? 'bg-red-400' : 'bg-amber-400'
                                            }`} />
                                        {wsProfile.status === 'connected' ? 'Connected' :
                                            wsProfile.status === 'disconnected' ? 'Disconnected' :
                                                wsProfile.status || 'Unknown'}
                                    </span>

                                    <div className="grid grid-cols-3 gap-2 mt-6">
                                        <button
                                            onClick={() => { setActiveTab('chats'); fetchWsChats(); }}
                                            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${activeTab === 'chats' ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            <MessageSquare size={18} />
                                            <span className="text-[10px]">Chats</span>
                                        </button>
                                        <button
                                            onClick={() => { setActiveTab('contacts'); fetchWsContacts(); }}
                                            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${activeTab === 'contacts' ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            <Users size={18} />
                                            <span className="text-[10px]">Contacts</span>
                                        </button>
                                        <button
                                            onClick={() => triggerWsSync()}
                                            className="p-2 rounded-lg flex flex-col items-center gap-1 bg-slate-800 text-slate-400 hover:bg-slate-700 group relative"
                                            title="Trigger Background Sync"
                                        >
                                            <Clock size={18} className="group-hover:text-green-500 transition-colors" />
                                            <span className="text-[10px]">Sync</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="lg:col-span-9 p-6 rounded-xl bg-slate-900 border border-slate-800 h-[600px] flex flex-col">
                                {wsLoading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
                                        <p className="text-slate-500 animate-pulse font-arabic">جاري جلب البيانات...</p>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === 'chats' && (
                                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">الدردشات النشطة</h4>
                                                {wsChats.length > 0 ? wsChats.map((chat, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => fetchWsMessages(chat.jid)}
                                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-green-500/50 hover:bg-slate-800/50 transition-all text-left"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                                <MessageSquare size={20} className="text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm truncate max-w-[200px]">{chat.name || 'Unknown'}</p>
                                                                <p className="text-xs text-slate-500 font-mono">{chat.jid}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-slate-500">Last Message</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(chat.last_message_time).toLocaleString()}</p>
                                                        </div>
                                                    </button>
                                                )) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic font-arabic">لا توجد دردشات مسجلة.</div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'contacts' && (
                                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">جهات الاتصال</h4>
                                                {wsContacts.length > 0 ? wsContacts.map((contact, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                                <User size={20} className="text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm">{contact.name || 'No Name'}</p>
                                                                <p className="text-xs text-slate-500 font-mono">{contact.jid}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => fetchWsMessages(contact.jid)}
                                                            className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                                                        >
                                                            View Messages
                                                        </button>
                                                    </div>
                                                )) : (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic font-arabic">لم يتم العثور على جهات اتصال.</div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'messages' && (
                                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => setActiveTab('chats')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                                            <ChevronLeft size={20} />
                                                        </button>
                                                        <div>
                                                            <h4 className="font-bold text-sm">Chat: {selectedChat}</h4>
                                                            <p className="text-[10px] text-slate-500">Messages are displayed as stored in the session</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                                    {wsMessages.length > 0 ? wsMessages.map((msg, idx) => (
                                                        <div key={idx} className={`flex flex-col ${msg.is_from_me ? 'items-end' : 'items-start'}`}>
                                                            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.is_from_me ? 'bg-green-600/20 text-green-100 rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                                                                {msg.content}
                                                                {msg.media_type && (
                                                                    <div className="mt-2 text-xs p-2 bg-black/20 rounded border border-white/5 flex items-center gap-2">
                                                                        <ImageIcon size={14} />
                                                                        Media: {msg.media_type}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[9px] text-slate-500 mt-1 font-mono">
                                                                {new Date(msg.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )) : (
                                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic font-arabic">لم يتم العثور على رسائل في هذه الدردشة.</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
