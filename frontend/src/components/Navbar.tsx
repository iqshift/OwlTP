"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const { t, language, setLanguage } = useTranslation();

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸', label: 'EN' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦', label: 'AR' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺', label: 'RU' },
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    return (
        <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
            <div className={`max-w-7xl mx-auto px-6 h-20 flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                {/* Logo - Should be opposite to items (Left in AR) */}
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/10 flex-shrink-0 overflow-hidden">
                        <Image src="/owl-mascot.png" alt="OwlTP" width={80} height={80} className="object-contain w-full h-full scale-110 drop-shadow-lg" />
                    </div>
                    <span className="text-2xl font-black tracking-tight">
                        <span className="text-green-500">O</span>
                        <span className="text-white">wl</span>
                        <span className="text-green-500">TP</span>
                    </span>
                </Link>

                {/* Desktop Menu - Should be on the Right in AR */}
                <div className={`hidden md:flex items-center gap-8 text-sm font-medium text-slate-400 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-8 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <a href="#features" className="hover:text-green-500 transition-colors uppercase tracking-wider">{t('nav_features', 'Features')}</a>
                        <a href="#pricing" className="hover:text-green-500 transition-colors uppercase tracking-wider">{t('nav_pricing', 'Pricing')}</a>
                        <a href="#about" className="hover:text-green-500 transition-colors uppercase tracking-wider">{t('nav_about', 'About')}</a>
                    </div>

                    {/* Language Switcher Dropdown */}
                    <div className={`relative ${language === 'ar' ? 'border-e pe-8' : 'border-s ps-8'} border-slate-800`}>
                        <button
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            onBlur={() => setTimeout(() => setLangDropdownOpen(false), 200)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-green-500/50 transition-all text-white font-bold"
                        >
                            <span className="text-lg">{currentLang.flag}</span>
                            <span className="text-xs tracking-widest">{currentLang.label}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${langDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {langDropdownOpen && (
                            <div className={`absolute top-full ${language === 'ar' ? 'right-0' : 'left-0'} mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50 overflow-hidden`}>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.code);
                                            setLangDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${language === lang.code ? 'bg-green-500/10 text-green-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{lang.flag}</span>
                                            <span className="font-bold">{lang.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black opacity-40">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`flex items-center gap-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Link href="/auth/login" className="text-white hover:text-green-500 transition-colors">{t('nav_login', 'Login')}</Link>
                        <Link href="/auth/register" className="bg-green-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/10">
                            {t('nav_register', 'Get Started')}
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        {languages.filter(l => l.code === language).map(lang => (
                            <button key={lang.code} className="w-8 h-8 rounded-lg bg-green-500/10 text-white flex items-center justify-center border border-green-500/20">
                                <span>{lang.flag}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-slate-950 border-b border-slate-800 p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-4">
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className={`text-lg font-bold text-white hover:text-green-500 transition-colors ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('nav_features', 'Features')}</a>
                        <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className={`text-lg font-bold text-white hover:text-green-500 transition-colors ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('nav_pricing', 'Pricing')}</a>
                        <a href="#about" onClick={() => setMobileMenuOpen(false)} className={`text-lg font-bold text-white hover:text-green-500 transition-colors ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('nav_about', 'About')}</a>
                        <hr className="border-slate-800" />
                        <div className={`flex justify-between items-center py-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm text-slate-500">Language</span>
                            <div className="flex gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { setLanguage(lang.code); setMobileMenuOpen(false); }}
                                        className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${language === lang.code ? 'bg-green-500/20 ring-1 ring-green-500/50 text-white' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="text-[10px] font-black">{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={`flex flex-col gap-3 py-4 ${language === 'ar' ? 'items-end' : 'items-start'}`}>
                            <Link href="/auth/login" className="text-white hover:text-green-500 transition-colors w-full p-2">{t('nav_login', 'Login')}</Link>
                            <Link href="/auth/register" className="bg-green-500 text-slate-950 px-5 py-3 rounded-xl font-bold hover:bg-green-400 transition-all w-full text-center">
                                {t('nav_register', 'Get Started')}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
