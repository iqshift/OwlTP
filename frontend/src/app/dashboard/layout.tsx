"use client";

import {
  LayoutDashboard,
  Link2,
  Key,
  History,
  Settings,
  LogOut,
  Shield,
  Globe,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, logout, token, setToken } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "authenticating">(
    "disconnected",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Require auth
    const existing = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
    if (!token && !existing) {
      router.replace("/auth/login");
      return;
    }
    if (!token && existing) {
      setToken(existing);
    }
    api
      .get("/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        logout();
        router.replace("/auth/login");
      });
  }, [logout, router, setToken, setUser, token]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    const pollStatus = async () => {
      try {
        const res = await api.get("/api/whatsapp/status");
        const status = res.data.status as "connected" | "disconnected" | "authenticating";
        setConnectionStatus(status);
      } catch {
        setConnectionStatus("disconnected");
      }
    };
    pollStatus();
    interval = setInterval(pollStatus, 5000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "WhatsApp Link", icon: Link2, href: "/dashboard/connect" },
    { name: "API Keys", icon: Key, href: "/dashboard/keys" },
    { name: "Send Test Message", icon: Key, href: "/dashboard/send" },
    { name: "Logs", icon: History, href: "/dashboard/logs" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  const statusColor =
    connectionStatus === "connected"
      ? "bg-green-500 text-green-400"
      : connectionStatus === "authenticating"
        ? "bg-yellow-500 text-yellow-400"
        : "bg-red-500 text-red-400";

  const statusLabel =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "authenticating"
        ? "Authenticating"
        : "Disconnected";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 shrink-0">
        <SidebarContent
          user={user}
          pathname={pathname}
          navItems={navItems}
          logout={logout}
          router={router}
        />
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <span className="text-green-500">OTP</span> Platform
              </h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
              <SidebarContent
                user={user}
                pathname={pathname}
                navItems={navItems}
                logout={logout}
                router={router}
                onItemClick={() => setIsSidebarOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-auto min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/50 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] md:text-xs font-medium bg-slate-900 border border-slate-800`}
            >
              <span className={`h-2 w-2 rounded-full ${statusColor.split(" ")[0]} animate-pulse`}></span>
              <span className="hidden sm:inline">{statusLabel}</span>
              <span className="sm:hidden">{statusLabel[0]}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:block text-sm text-slate-400 truncate max-w-[150px]">
                {user?.email || "loading@user"}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-bold text-xs">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </header>

        <section className="p-4 md:p-8">{children}</section>
      </main>
    </div>
  );
}

// Logic extracted to avoid duplication
function SidebarContent({ user, pathname, navItems, logout, router, onItemClick }: any) {
  return (
    <>
      <div className="p-5 hidden md:block border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/10 flex-shrink-0 overflow-hidden">
            <Image src="/owl-mascot.png" alt="OwlTP" width={64} height={64} className="object-contain w-full h-full scale-110 drop-shadow-lg" />
          </div>
          <span className="text-xl font-black tracking-tight">
            <span className="text-green-500">O</span>
            <span className="text-white">wl</span>
            <span className="text-green-500">TP</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item: any) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => onItemClick?.()}
            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${pathname === item.href
              ? "bg-green-500/10 text-green-500"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        ))}

        {user?.role === "admin" && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Administration
            </p>
            <Link
              href="/admin"
              onClick={() => onItemClick?.()}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${pathname === "/admin"
                ? "bg-purple-500/10 text-purple-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <Shield size={20} />
              Users Management
            </Link>
            <Link
              href="/admin/plans"
              onClick={() => onItemClick?.()}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${pathname === "/admin/plans"
                ? "bg-purple-500/10 text-purple-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <Settings size={20} />
              Manage Plans
            </Link>
            <Link
              href="/admin/translations"
              onClick={() => onItemClick?.()}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${pathname === "/admin/translations"
                ? "bg-purple-500/10 text-purple-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
            >
              <Globe size={20} />
              Manage Languages
            </Link>
          </div>
        )}
      </nav>
      <div className="border-t border-slate-800 p-4 space-y-4">
        {user?.role !== "admin" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Plan</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-green-500 uppercase">{user?.plan || "FREE"}</span>
                <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 uppercase">Active</span>
              </div>
            </div>
            {user?.plan?.toLowerCase() !== 'enterprise' ? (
              <Link href="/dashboard/plans" className="block w-full bg-green-500 hover:bg-green-400 text-slate-950 text-xs font-bold py-2 rounded-lg transition-all shadow-lg shadow-green-500/10 text-center">
                {user?.plan?.toLowerCase() === 'pro' ? 'Upgrade to ENTERPRISE' : 'Upgrade to PRO'}
              </Link>
            ) : (
              <div className="w-full bg-slate-800 text-slate-400 text-[10px] font-bold py-2 rounded-lg text-center border border-slate-700">
                ⭐ PREMIUM STATUS
              </div>
            )}
          </div>
        )}

        <button
          className="flex w-full items-center gap-3 px-3 py-2 text-red-500 transition-colors hover:bg-red-500/10 rounded-md font-medium"
          onClick={() => {
            logout();
            router.replace("/auth/login");
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </>
  );
}

