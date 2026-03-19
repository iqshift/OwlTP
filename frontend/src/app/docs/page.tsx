"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Shield, Globe, Code, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";


// Register GSAP plugins
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

export default function DocsLandingPage() {
    const owlRef = useRef<SVGSVGElement>(null);
    const leftWingRef = useRef<SVGPathElement>(null);
    const rightWingRef = useRef<SVGPathElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!owlRef.current || !containerRef.current) return;

        // 1. Hover/Floating animation (Idle)
        gsap.to(owlRef.current, {
            y: "-=15",
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // 2. Wing Flap Animation
        gsap.to([leftWingRef.current, rightWingRef.current], {
            rotationX: 45,
            duration: 0.4,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            transformOrigin: "center top"
        });

        // 3. Motion Path Flight (Scroll-Triggered)
        // Define points A -> B -> D -> C relative to viewport
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
                // markers: true,
            }
        });

        tl.to(owlRef.current, {
            motionPath: {
                path: [
                    { x: 100, y: 100 },   // A
                    { x: 800, y: 300 },   // B
                    { x: 200, y: 600 },   // D
                    { x: 900, y: 900 }    // C
                ],
                curviness: 1.5,
                autoRotate: true,
            },
            ease: "none",
        });

        // Hide on mobile via GSAP check
        if (window.innerWidth < 768) {
            gsap.set(owlRef.current, { opacity: 0, display: "none" });
        }

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-[#020617] text-slate-200 selection:bg-green-500/30 font-sans overflow-x-hidden relative">

            {/* Animated Owl SVG */}
            <svg
                ref={owlRef}
                viewBox="0 0 100 100"
                className="fixed w-20 h-20 z-50 pointer-events-none drop-shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                style={{ top: '10%', left: '5%' }}
            >
                {/* Geometric Owl Design */}
                <g>
                    {/* Body */}
                    <path d="M50 20 L75 40 L70 75 L50 85 L30 75 L25 40 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

                    {/* Left Wing */}
                    <path
                        ref={leftWingRef}
                        d="M30 40 L5 30 L15 60 L30 55 Z"
                        fill="#0f172a"
                        stroke="#22c55e"
                        strokeWidth="0.5"
                    />

                    {/* Right Wing */}
                    <path
                        ref={rightWingRef}
                        d="M70 40 L95 30 L85 60 L70 55 Z"
                        fill="#0f172a"
                        stroke="#22c55e"
                        strokeWidth="0.5"
                    />

                    {/* Face / Head */}
                    <path d="M35 30 L50 45 L65 30 L50 20 Z" fill="#1e293b" />

                    {/* Eyes - Emerald Accents */}
                    <circle cx="42" cy="35" r="3" fill="#22c55e" className="animate-pulse" />
                    <circle cx="58" cy="35" r="3" fill="#22c55e" className="animate-pulse" />

                    {/* Beak */}
                    <path d="M48 42 L52 42 L50 48 Z" fill="#f59e0b" />
                </g>
            </svg>

            {/* Navigation (Overlay) */}
            <nav className="fixed top-0 w-full z-40 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                            <Image src="/owl-mascot.png" alt="OwlTP" width={40} height={40} className="object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            <span className="text-green-500">O</span>
                            <span className="text-white">wl</span>
                            <span className="text-green-500">TP</span>
                        </span>
                    </div>
                    <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-green-500 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-green-500 transition-colors">How it Works</a>
                        <a href="#" className="hover:text-green-500 transition-colors">Documentation</a>
                    </div>
                    <Link href="/auth/login" className="text-sm font-bold text-white border border-white/10 px-5 py-2 rounded-full hover:bg-white/5 transition-all">
                        Login
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-48 pb-32 px-6">
                <div className="max-w-4xl mx-auto text-center relative">
                    {/* Owl Mascot */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-40 h-40 drop-shadow-2xl animate-bounce" style={{ animationDuration: '3s' }}>
                            <Image src="/owl-mascot.png" alt="OwlTP Mascot" fill className="object-contain" />
                        </div>
                    </div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest mb-8">
                        The Developer's Choice
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1]">
                        Send OTPs via <br />
                        <span className="text-green-500">WhatsApp Instantly</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
                        A robust, high-performance API designed for modern startups.
                        Deliver verification codes globally with 99.9% uptime and zero friction.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/auth/register" className="bg-green-500 text-slate-950 px-8 py-4 rounded-xl font-black text-lg hover:bg-green-400 transition-all hover:scale-105 shadow-lg shadow-green-500/20">
                            Start Free Trial
                        </Link>
                        <button className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                            <Code size={20} />
                            API Reference
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-slate-950/40 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Engineered for Reliability</h2>
                        <p className="text-slate-400">Scale your authentication without breaking a sweat.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "Fast API", icon: Zap, desc: "Global delivery in under 2 seconds. Benchmarked for extreme low latency." },
                            { title: "Scalable", icon: Globe, desc: "Handles millions of daily requests effortlessly with auto-scaling infra." },
                            { title: "Secure", icon: Shield, desc: "End-to-end encrypted tunnels. Your data never leaves our secure perimeter." },
                            { title: "Dev Friendly", icon: Code, desc: "One-line integration for any stack. Native SDKs for PHP, JS, and Python." }
                        ].map((f, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-green-500/30 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
                                    <f.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-8">Simple Integration, <br />Powerful Results</h2>
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Generate API Key", desc: "Create a project in your dashboard and get your secure token instantly." },
                                    { step: "02", title: "Connect WhatsApp", desc: "Link your device via QR code. Our cloud handles everything else." },
                                    { step: "03", title: "Start Sending", desc: "Use our REST API to trigger OTPs to any number worldwide." }
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className="text-green-500 font-black text-2xl opacity-40">{s.step}</div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-2">{s.title}</h4>
                                            <p className="text-slate-400 leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-[2.5rem] border border-white/5 shadow-2xl">
                            <div className="bg-slate-950 rounded-[2rem] p-8 font-mono text-sm overflow-hidden">
                                <div className="flex gap-2 mb-6">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20" />
                                </div>
                                <pre className="text-green-400 leading-relaxed">
                                    <code>{`curl -X POST https://api.owltp.com/v1/send \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "phone": "+1234567890",
    "code": "482910"
  }'`}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-green-500 to-emerald-700 text-center relative overflow-hidden group">
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-950 mb-8 tracking-tight">
                            Ready to secure your app?
                        </h2>
                        <p className="text-slate-900/70 text-lg md:text-xl font-medium mb-12 max-w-xl mx-auto leading-relaxed">
                            Join 500+ developers scaling their businesses with OwlTP.
                            Start today with 100 free credits.
                        </p>
                        <Link href="/auth/register" className="bg-slate-950 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-900 transition-all hover:scale-105 shadow-2xl shadow-black/20 inline-flex items-center gap-2">
                            Get Started Now
                            <ChevronRight size={24} />
                        </Link>
                    </div>
                    {/* Decorative Background Owl */}
                    <div className="absolute -bottom-6 -right-6 opacity-20 group-hover:scale-110 transition-transform duration-1000 w-48 h-48">
                        <Image src="/owl-mascot.png" alt="" fill className="object-contain" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 bg-slate-950/20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-xs font-medium uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Image src="/owl-mascot.png" alt="OwlTP" width={20} height={20} className="object-contain" />
                        <span className="text-white">OwlTP Platform</span>
                    </div>
                    <p>© 2026 Built with precision. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Status</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
