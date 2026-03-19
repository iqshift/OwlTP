"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Zap, Download } from "lucide-react";

const icons = [
    {
        id: "api-key",
        label: "API Key",
        file: "/owl-api-key.png",
        color: "from-amber-500/20 to-yellow-500/5",
        border: "border-amber-500/30",
        badge: "bg-amber-500/10 text-amber-400",
        desc: "Authentication token for API access",
    },
    {
        id: "success",
        label: "Success",
        file: "/owl-success.png",
        color: "from-green-500/20 to-emerald-500/5",
        border: "border-green-500/30",
        badge: "bg-green-500/10 text-green-400",
        desc: "OTP delivered successfully",
    },
    {
        id: "message",
        label: "Message Sent",
        file: "/owl-message.png",
        color: "from-blue-500/20 to-sky-500/5",
        border: "border-blue-500/30",
        badge: "bg-blue-500/10 text-blue-400",
        desc: "Message dispatched via WhatsApp",
    },
    {
        id: "dashboard",
        label: "Dashboard",
        file: "/owl-dashboard.png",
        color: "from-purple-500/20 to-violet-500/5",
        border: "border-purple-500/30",
        badge: "bg-purple-500/10 text-purple-400",
        desc: "Analytics and usage stats",
    },
    {
        id: "loading",
        label: "Loading",
        file: "/owl-loading.png",
        color: "from-cyan-500/20 to-teal-500/5",
        border: "border-cyan-500/30",
        badge: "bg-cyan-500/10 text-cyan-400",
        desc: "Background processing in progress",
    },
    {
        id: "failed",
        label: "Message Failed",
        file: "/owl-failed.png",
        color: "from-red-500/20 to-rose-500/5",
        border: "border-red-500/30",
        badge: "bg-red-500/10 text-red-400",
        desc: "Delivery error or authentication failed",
    },
];

export default function TestPage() {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
            {/* Top nav */}
            <nav className="sticky top-0 z-30 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <Link href="/docs" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                        <Image src="/owl-mascot.png" alt="OwlTP" width={36} height={36} className="object-contain w-full h-full" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">
                        <span className="text-green-500">O</span>
                        <span className="text-white">wl</span>
                        <span className="text-green-500">TP</span>
                    </span>
                </Link>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full">
                    Icon Library
                </span>
            </nav>

            {/* Hero text */}
            <section className="pt-20 pb-12 px-6 text-center">
                <p className="text-green-500 text-xs font-bold uppercase tracking-widest mb-4">Brand Assets</p>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">OwlTP Icon Set</h1>
                <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                    A cohesive set of custom owl icons representing every state in the OwlTP lifecycle — from authentication to delivery.
                </p>
            </section>

            {/* Icon Grid */}
            <section className="max-w-6xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                    {icons.map((icon) => (
                        <div
                            key={icon.id}
                            onMouseEnter={() => setHovered(icon.id)}
                            onMouseLeave={() => setHovered(null)}
                            className={`relative group rounded-3xl border ${icon.border} bg-gradient-to-br ${icon.color} p-6 flex flex-col items-center gap-4 transition-all duration-300
                                ${hovered === icon.id ? "scale-105 shadow-xl" : "scale-100"}
                            `}
                        >
                            {/* Status badge */}
                            <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${icon.badge}`}>
                                {icon.label}
                            </span>

                            {/* Owl Image */}
                            <div className="relative w-32 h-32 md:w-40 md:h-40 transition-transform duration-500 group-hover:-translate-y-3">
                                <Image
                                    src={icon.file}
                                    alt={icon.label}
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    sizes="(max-width: 768px) 128px, 160px"
                                />
                            </div>

                            {/* Info */}
                            <div className="text-center">
                                <h3 className="text-white font-bold text-lg">{icon.label}</h3>
                                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{icon.desc}</p>
                            </div>

                            {/* Download hover button */}
                            <a
                                href={icon.file}
                                download
                                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border transition-all duration-300 ${icon.badge} border-current
                                    ${hovered === icon.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
                                `}
                            >
                                <Download size={12} />
                                Download PNG
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom usage note */}
            <div className="border-t border-white/5 py-10 text-center px-6">
                <p className="text-slate-600 text-xs">
                    All icons are property of OwlTP. For use within the OwlTP platform only.
                </p>
            </div>
        </div>
    );
}
