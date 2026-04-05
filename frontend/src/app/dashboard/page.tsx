'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Stat {
    name: string;
    value: string;
    change: string;
}

interface RecentActivity {
    id: string;
    phone?: string;
    status: string;
    action?: string; // For Audit Logs
    created_at: string;
}

interface DailyStat {
    date: string;
    count: number;
}

interface DashboardData {
    total_messages: number;
    success_rate: number;
    active_sessions: number;
    monthly_usage: string;
    plan: string;
    recent_activity: RecentActivity[];
    recent_audit: any[]; // Phase 8: Operational logs
    daily_stats: DailyStat[];
}

function TrafficChart({ data }: { data: DailyStat[] }) {
    if (!data || data.length === 0) return null;

    const maxCount = Math.max(...data.map(d => d.count), 5);
    const height = 200;
    const width = 600;
    const padding = 20;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((d.count / maxCount) * (height - padding * 2) + padding);
        return { x, y, count: d.count, date: d.date };
    });

    const pathData = `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

    const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
        <div className="w-full h-full flex flex-col pt-4">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-sm font-bold text-slate-300">Message Traffic (Last 7 Days)</h3>
                <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        <span>OTP Traffic</span>
                    </div>
                </div>
            </div>
            <div className="relative flex-1 group">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <line
                            key={i}
                            x1={padding}
                            y1={padding + (height - padding * 2) * p}
                            x2={width - padding}
                            y2={padding + (height - padding * 2) * p}
                            stroke="#1e293b"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Area */}
                    <path d={areaData} fill="url(#areaGradient)" className="transition-all duration-700 ease-in-out" />

                    {/* Line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-700 ease-in-out"
                    />

                    {/* Data Points */}
                    {points.map((p, i) => (
                        <g key={i} className="cursor-pointer group/point">
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="#22c55e"
                                className="transition-all hover:r-6"
                            />
                            <text
                                x={p.x}
                                y={p.y - 12}
                                textAnchor="middle"
                                className="text-[10px] fill-slate-300 font-bold opacity-0 group-hover/point:opacity-100 transition-opacity"
                            >
                                {p.count}
                            </text>
                        </g>
                    ))}

                    {/* X-Axis Labels */}
                    {points.map((p, i) => (
                        <text
                            key={i}
                            x={p.x}
                            y={height + 15}
                            textAnchor="middle"
                            className="text-[9px] fill-slate-500 font-medium tracking-tighter"
                        >
                            {p.date}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stat[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats');
                const data: DashboardData = response.data;

                setStats([
                    { name: 'Total Messages', value: data.total_messages.toLocaleString(), change: '+ Real-time' },
                    { name: 'Success Rate', value: `${data.success_rate}%`, change: 'Based on sent' },
                    { name: 'Active Sessions', value: data.active_sessions.toString(), change: 'Stable' },
                    { name: 'Monthly Credits', value: data.monthly_usage, change: `Plan: ${data.plan}` },
                ]);

                // Merge Logs: Prioritize OTPs, fallback to Audit if OTPs empty
                if (data.recent_activity && data.recent_activity.length > 0) {
                    setRecentActivity(data.recent_activity);
                } else if (data.recent_audit && data.recent_audit.length > 0) {
                    // Transform Audit to RecentActivity shape
                    const auditAsActivity = data.recent_audit.map((a: any) => ({
                        id: a.id,
                        action: a.action,
                        status: 'audit',
                        created_at: a.created_at
                    }));
                    setRecentActivity(auditAsActivity);
                } else {
                    setRecentActivity([]);
                }

                setDailyStats(data.daily_stats);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-slate-400">Welcome back. Here is what's happening today.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="p-4 md:p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] duration-300 shadow-xl shadow-black/20">
                        <p className="text-xs md:text-sm text-slate-400 mb-1">{stat.name}</p>
                        <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs mt-2 text-slate-500">
                            {stat.change}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 h-80 flex items-center justify-center shadow-xl shadow-black/20 overflow-hidden">
                    <TrafficChart data={dailyStats} />
                </div>
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                    <h3 className="font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 text-sm group">
                                <div className={`w-2 h-2 rounded-full ${
                                    activity.status === 'sent' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                                    activity.status === 'audit' ? 'bg-blue-400' : 'bg-red-500'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="font-medium">
                                        {activity.status === 'audit' 
                                            ? `Action: ${activity.action}` 
                                            : `OTP ${activity.status === 'sent' ? 'Sent' : 'Failed'} to ${activity.phone}`}
                                    </p>
                                    <p className="text-slate-500 text-[10px] font-mono">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-500 text-sm italic text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
