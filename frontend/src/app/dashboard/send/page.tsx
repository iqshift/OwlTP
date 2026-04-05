"use client";

import { FormEvent, useState } from "react";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type APIKeyData = {
  api_token: string;
  is_token_masked: boolean;
};

export default function SendTestMessagePage() {
  const { data } = useQuery<APIKeyData>({
    queryKey: ["api-key"],
    queryFn: async () => {
      const res = await api.get("/keys");
      return res.data;
    },
  });

  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!data?.api_token) {
      setError("API token not loaded");
      return;
    }
    if (data?.is_token_masked) {
      setError("Your API token is masked for security. Please go to the API Keys page and Regenerate a new token to use this feature.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post("/send", {
        phone: phone,
        code: code,
      }, {
        headers: {
          Authorization: `Bearer ${data.api_token}`,
        },
      });

      if (res.data.success) {
        setResult("تم إرسال الكود بنجاح! تحقق من الجلسة النشطة.");
      } else {
        setError(res.data.error || "فشل الإرسال. تأكد من اتصال WhatsApp.");
      }
    } catch (err: any) {
      console.error("SEND_TEST_ERROR:", err);
      setError(err?.response?.data?.detail || "خطأ في الاتصال بالخادم. تأكد من صحة التوكن والبيانات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Send Test Message</h1>
        <p className="text-slate-400">
          Quickly verify your WhatsApp OTP integration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Phone number (E.164)
          </label>
          <input
            type="text"
            placeholder="9647XXXXXXXX"
            value={phone}
            onChange={(e: any) => setPhone(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            {/* Using numeric code only now */}
            OTP Code (Required)
          </label>
          <input
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e: any) => {
              const val = e.target.value;
              if (val === '' || /^\d+$/.test(val)) {
                setCode(val);
              }
            }}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
            required
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Your saved template from settings will be used automatically.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Test Message"}
        </button>
        {result && (
          <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            {result}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

