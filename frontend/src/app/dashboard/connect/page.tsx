"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/hooks/useTranslation";

type SessionStatus = {
  status: string;
  device_id?: string | null;
  connected_at?: string | null;
  last_error?: string | null;
};

type QRResponse = {
  status: string;
  qr?: string | null;
  message?: string | null;
};

const PLAN_SESSION_LIMITS: Record<string, number> = {
  free: 1,
  pro: 3,
  enterprise: 10,
};

export default function ConnectPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<SessionStatus[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>("disconnected");
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addMsg, setAddMsg] = useState<string | null>(null);

  const planName = (user as any)?.plan || "free";
  const maxSessions = PLAN_SESSION_LIMITS[planName] ?? 1;

  const { t } = useTranslation();

  // Load all sessions
  const fetchSessions = async () => {
    try {
      const res = await api.get<SessionStatus[]>("/whatsapp/sessions");
      setSessions(res.data || []);
    } catch {
      setSessions([]);
    }
  };

  // Load QR for active session
  const fetchQR = async (index: number = activeIndex, force: boolean = false) => {
    setQrLoading(true);
    try {
      const res = await api.get<QRResponse>(`/whatsapp/qr?session_index=${index}${force ? "&force=true" : ""}`);
      setQrStatus(res.data.status);
      setQrCode(res.data.qr || null);
      setError(null);
    } catch (err: any) {
      setError(t('error_loading_qr', "Failed to load QR code"));
    } finally {
      setQrLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSessions();
      await fetchQR(0);
    };
    init();
    const interval = setInterval(() => {
      fetchSessions();
      fetchQR(activeIndex);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // When active session tab changes: reset state then load QR
  useEffect(() => {
    // Reset stale state from previous session
    setQrCode(null);
    setQrStatus("disconnected");
    setError(null);
    setQrLoading(true);

    // Load with force to start CLI for disconnected sessions
    fetchQR(activeIndex, true);

    // Keep retrying every 5s until QR appears or session connects
    const retryInterval = setInterval(() => {
      fetchQR(activeIndex, false);
    }, 5000);
    return () => clearInterval(retryInterval);
  }, [activeIndex]);

  const handleReset = async () => {
    if (!confirm(t('confirm_reset', "Reset current connection?"))) return;
    setLoading(true);
    try {
      await api.post("/whatsapp/reset");
      window.location.reload();
    } catch {
      alert(t('reset_failed', "Reset failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async () => {
    setAddMsg(null);
    try {
      const res = await api.post("/whatsapp/sessions/add");
      setAddMsg((res.data as any).message || t('session_created', "Session created"));
      // get the real new index from API response
      const newIndex: number = (res.data as any).session_index ?? 1;
      await fetchSessions();
      setActiveIndex(newIndex);
      // force start CLI for new session to get QR
      await fetchQR(newIndex, true);
    } catch (err: any) {
      setAddMsg(err?.response?.data?.detail || t('session_failed', "Failed to create session"));
    }
  };

  const handleDeleteSession = async (index: number) => {
    if (!confirm(t('confirm_delete', `Delete session ${index + 1}?`))) return;
    try {
      await api.delete(`/whatsapp/sessions/${index}`);
      await fetchSessions();
      if (activeIndex >= index) setActiveIndex(Math.max(0, index - 1));
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('delete_failed', "Failed to delete session"));
    }
  };

  const isConnected = qrStatus === "connected";

  const statusColor = (s: string) => {
    if (s === "connected") return "text-green-400 bg-green-500/10 border-green-500/30";
    if (s === "qr_ready") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  const statusLabel = (s: string) => {
    if (s === "connected") return t('connected', "Connected");
    if (s === "qr_ready") return t('awaiting_scan', "Waiting for scan");
    return t('disconnected', "Disconnected");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">WhatsApp Connection</h1>
        <p className="text-slate-400">Link your device(s) to start sending OTPs via the API.</p>
      </div>

      {/* Sessions Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">{t('active_sessions', "Active Sessions")}</h2>
            <p className="text-xs text-slate-500">{sessions.length} / {maxSessions} {t('sessions_limit', "sessions")} — {t('plan', "Plan")} {planName.toUpperCase()}</p>
          </div>
          {sessions.length < maxSessions ? (
            <button
              onClick={handleAddSession}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow shadow-green-500/20"
            >
              <Plus size={16} />
              {t('add_session', "Add Session")}
            </button>
          ) : (
            <span className="text-xs text-slate-500 border border-slate-700 rounded-lg px-3 py-1.5">
              {t('max_plan_limit', "Plan limit reached")}
            </span>
          )}
        </div>

        {addMsg && (
          <div className={`mb-3 text-sm px-3 py-2 rounded-lg border ${addMsg.includes("created") ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            {addMsg}
          </div>
        )}

        {/* Session tabs */}
        <div className="flex gap-2 flex-wrap">
          {sessions.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${activeIndex === i ? "border-green-500/50 bg-green-500/10" : "border-slate-700 bg-slate-950 hover:border-slate-600"}`}
              onClick={() => setActiveIndex(i)}>
              <span className={`w-2 h-2 rounded-full ${s.status === "connected" ? "bg-green-500" : s.status === "qr_ready" ? "bg-yellow-500" : "bg-red-500"}`} />
              <span className="text-sm font-medium text-white">{t('session', "Session")} {i + 1}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(s.status)}`}>
                {statusLabel(s.status)}
              </span>
              {i > 0 && (
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(i); }}
                  className="text-red-500/60 hover:text-red-500 transition-colors ml-1">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-slate-500 text-sm">{t('no_sessions', "No sessions yet")}</div>
          )}
        </div>
      </div>

      {/* QR Section */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">{t('session', "Session")} {activeIndex + 1}</h2>
          <div className="flex gap-2">
            <button onClick={() => fetchQR(activeIndex)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all">
              <RefreshCw size={12} />
              {t('refresh', "Refresh")}
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all">
              {t('reset', "Reset")}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {/* QR Box */}
          <div className="w-64 h-64 rounded-2xl flex items-center justify-center border border-slate-700 bg-slate-950 overflow-hidden">
            {qrLoading || loading ? (
              <div className="text-slate-500 text-sm animate-pulse">{t('loading', "Loading...")}</div>
            ) : isConnected ? (
              <div className="text-center space-y-2">
                <Wifi size={40} className="text-green-400 mx-auto" />
                <p className="text-green-400 font-bold">{t('connected', "Connected")}</p>
                <p className="text-slate-400 text-xs">{t('session', "Session")} {activeIndex + 1} {t('working_success', "is active")}</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400 text-sm px-4">{error}</div>
            ) : qrCode ? (
              <img
                src={qrCode}
                alt="WhatsApp QR"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-center space-y-2">
                <WifiOff size={32} className="text-slate-500 mx-auto" />
                <p className="text-slate-500 text-sm">{t('click_refresh_qr', "Click refresh to get QR")}</p>
              </div>
            )}
          </div>

          {/* How to link */}
          {!isConnected && (
            <div className="text-center space-y-2 text-sm text-slate-400">
              <p className="font-semibold text-white">{t('how_to_link', "How to link:")}</p>
              <ol className="text-start space-y-1.5 list-decimal list-inside">
                <li>{t('link_step_1', "Open WhatsApp on your mobile phone.")}</li>
                <li>{t('link_step_2', "Tap Menu (⋮) or Settings (⚙) and select")} <strong>{t('linked_devices', "Linked Devices")}</strong>.</li>
                <li>{t('link_step_3', "Tap on")} <strong>{t('link_a_device', "Link a Device")}</strong>.</li>
                <li>{t('link_step_4', "Point your phone to this screen to capture the code.")}</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
