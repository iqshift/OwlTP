'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import {
    LogOut,
    LayoutDashboard,
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Check,
    Shield,
    Info,
    ListChecks
} from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    monthly_quota: number;
    is_featured: boolean;
    created_at: string;
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<string | null>(null); // Plan ID or 'new'
    const [formData, setFormData] = useState<Partial<Plan>>({
        name: '',
        price: '',
        description: '',
        features: [],
        monthly_quota: 100,
        is_featured: false
    });
    const [featureInput, setFeatureInput] = useState('');

    const { logout } = useAuthStore();
    const router = useRouter();

    const fetchPlans = async () => {
        try {
            const response = await api.get('/api/plans');
            setPlans(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleFeatureAdd = () => {
        if (!featureInput.trim()) return;
        setFormData({
            ...formData,
            features: [...(formData.features || []), featureInput.trim()]
        });
        setFeatureInput('');
    };

    const handleFeatureRemove = (index: number) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures.splice(index, 1);
        setFormData({ ...formData, features: newFeatures });
    };

    const handleEdit = (plan: Plan) => {
        setIsEditing(plan.id);
        setFormData(plan);
    };

    const handleCancel = () => {
        setIsEditing(null);
        setFormData({
            name: '',
            price: '',
            description: '',
            features: [],
            monthly_quota: 100,
            is_featured: false
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing === 'new') {
                await api.post('/api/admin/plans', formData);
            } else {
                await api.patch(`/api/admin/plans/${isEditing}`, formData);
            }
            setIsEditing(null);
            fetchPlans();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save plan');
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        setLoading(true);
        try {
            await api.delete(`/api/admin/plans/${id}`);
            fetchPlans();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete plan');
            setLoading(false);
        }
    };

    if (loading && plans.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors">
                            <LayoutDashboard size={20} className="text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Manage Plans</h1>
                            <p className="text-slate-400">Add or edit subscription plans and pricing.</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing('new')}
                            className="bg-green-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                        >
                            <Plus size={20} />
                            Add New Plan
                        </button>
                    )}
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
                        <Info size={18} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto"><X size={18} /></button>
                    </div>
                )}

                {/* Edit/New Form Overlay/Section */}
                {isEditing && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{isEditing === 'new' ? 'Create New Plan' : 'Edit Plan'}</h2>
                            <button onClick={handleCancel} className="text-slate-500 hover:text-white"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Plan Name</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500/50 outline-none"
                                        placeholder="e.g. Pro Plan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Price Display</label>
                                    <input
                                        type="text" required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500/50 outline-none"
                                        placeholder="e.g. $29"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Monthly Quota (0 for Unlimited)</label>
                                    <input
                                        type="number" required
                                        value={formData.monthly_quota}
                                        onChange={e => setFormData({ ...formData, monthly_quota: parseInt(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500/50 outline-none resize-none"
                                        placeholder="Perfect for growing teams..."
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={formData.is_featured}
                                        onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-800 bg-slate-950 text-green-500 focus:ring-0"
                                    />
                                    <label htmlFor="featured" className="text-white font-medium cursor-pointer uppercase text-xs tracking-widest">Mark as Featured (Recommended)</label>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Features</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={featureInput}
                                            onChange={e => setFeatureInput(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleFeatureAdd())}
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500/50 outline-none"
                                            placeholder="Add feature..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleFeatureAdd}
                                            className="bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition-colors"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                    <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {(formData.features || []).map((feature, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-slate-950/50 border border-slate-800 px-4 py-2 rounded-lg">
                                                <span className="text-sm text-slate-300">{feature}</span>
                                                <button type="button" onClick={() => handleFeatureRemove(idx)} className="text-red-500 hover:text-red-400">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-green-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-green-400 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} />
                                        Save Plan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-8 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Plans List */}
                {!isEditing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div key={plan.id} className={`group relative p-8 rounded-3xl border ${plan.is_featured ? 'bg-slate-900 border-green-500/50 shadow-2xl shadow-green-500/5' : 'bg-slate-900/40 border-slate-800'} transition-all hover:scale-[1.02]`}>
                                {plan.is_featured && (
                                    <span className="absolute -top-3 left-6 bg-green-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-green-500/20">Featured</span>
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                                        <p className="text-slate-500 text-sm leading-tight">{plan.description}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(plan)} className="p-2 bg-slate-800 text-blue-400 rounded-lg hover:bg-slate-700 transition-colors">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(plan.id)} className="p-2 bg-slate-800 text-red-500 rounded-lg hover:bg-slate-700 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <span className="text-4xl font-black text-white">{plan.price}</span>
                                    {plan.price.includes('$') && <span className="text-slate-500 text-sm ml-1">/month</span>}
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                                            <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center">
                                                <Check size={12} className="text-green-500" />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Quota: {plan.monthly_quota === 0 ? 'Unlimited' : `${plan.monthly_quota} / mo`}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
