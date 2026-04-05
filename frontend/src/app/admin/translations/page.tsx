"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Globe, Save, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

interface Translation {
    id: string;
    key: string;
    en: string;
    ar: string;
    ru: string;
}

export default function AdminTranslationsPage() {
    const [translations, setTranslations] = useState<Translation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const { logout } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            const response = await api.get('/admin/translations');
            setTranslations(response.data);
        } catch (error) {
            console.error('Failed to fetch translations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (t: Translation) => {
        setSaving(t.id);
        try {
            await api.post('/api/admin/translations', t);
            // Optional: show success toast
        } catch (error) {
            console.error('Failed to save translation:', error);
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this translation key?')) return;
        try {
            await api.delete(`/api/admin/translations/${id}`);
            setTranslations(translations.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete translation:', error);
        }
    };

    const addNewKey = () => {
        const newKey: Translation = {
            id: 'new-' + Date.now(),
            key: '',
            en: '',
            ar: '',
            ru: ''
        };
        setTranslations([newKey, ...translations]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Translation Management</h2>
                    <div className="flex gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>
                        <Link href="/admin" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <Globe size={18} />
                            Users
                        </Link>
                    </div>
                </div>
                <button onClick={addNewKey} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Plus size={18} /> Add New Key
                </button>
            </div>

            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    {translations.map((t) => (
                        <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <input
                                    placeholder="Key (e.g. hero_title)"
                                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm font-mono w-1/3 focus:outline-none focus:border-emerald-500"
                                    value={t.key}
                                    onChange={(e) => setTranslations(translations.map(item => item.id === t.id ? { ...item, key: e.target.value } : item))}
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={saving === t.id}
                                        onClick={() => handleSave(t)}
                                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    >
                                        {saving === t.id ? <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" /> : <Save size={20} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">English</label>
                                    <textarea
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]"
                                        value={t.en}
                                        onChange={(e) => setTranslations(translations.map(item => item.id === t.id ? { ...item, en: e.target.value } : item))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Arabic (Iraq)</label>
                                    <textarea
                                        dir="rtl"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]"
                                        value={t.ar}
                                        onChange={(e) => setTranslations(translations.map(item => item.id === t.id ? { ...item, ar: e.target.value } : item))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Russian</label>
                                    <textarea
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]"
                                        value={t.ru}
                                        onChange={(e) => setTranslations(translations.map(item => item.id === t.id ? { ...item, ru: e.target.value } : item))}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
