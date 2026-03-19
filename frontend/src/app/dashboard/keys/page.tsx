"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";

type APIKeyData = {
  api_token: string;
  plan: string;
  monthly_quota: number;
  messages_sent_month: number;
};

export default function APIKeysPage() {
  const [data, setData] = useState<APIKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<string>("curl");
  const [showToken, setShowToken] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get<APIKeyData>("/api/keys");
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load API key");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCopy = () => {
    if (!data?.api_token) return;
    navigator.clipboard.writeText(data.api_token).catch(() => { });
  };

  const handleRegenerate = async () => {
    try {
      const res = await api.post<APIKeyData>("/api/keys/regenerate");
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to regenerate token");
    }
  };

  const HighlightedCode = ({ code }: { code: string }) => {
    // VS Code inspired colors (One Dark Pro)
    const syntaxColors = {
      keyword: "text-pink-400",    // const, import, if, return, var
      string: "text-green-300",     // "..."
      function: "text-blue-400",   // fetch, print, requests.post
      comment: "text-slate-500 italic", // // ...
      variable: "text-orange-300",  // phone, message, url
      number: "text-purple-400",    // 123456
      bracket: "text-yellow-400",   // (), {}, []
    };

    // Simple regex-based highlighter
    const parts = code.split(/(".*?"|'.*?'|\/\/.*|\b(?:const|let|var|function|return|if|else|import|from|import|default|public|static|class|void|throws|extends|implements|try|catch|case|switch|default|while|for|do|in|as|new|typeof|await|async|bool|string|int|float|double|var|null)\b|\b\d+\b|[(){}[\]]|\b(?:fetch|api|api_url|token|requests|post|get|json|exec|init|close|curl_init|curl_setopt|curl_exec|curl_close|println|print|send|then|JSON\.stringify|HttpClient|HttpRequest|HttpResponse|BodyPublishers|ofString|BodyHandlers)\b)/g);

    return (
      <code className="block">
        {parts.map((part, i) => {
          if (!part) return null;

          if (part.startsWith('"') || part.startsWith("'"))
            return <span key={i} className={syntaxColors.string}>{part}</span>;
          if (part.startsWith("//") || part.startsWith("/*"))
            return <span key={i} className={syntaxColors.comment}>{part}</span>;
          if (/^(?:const|let|var|function|return|if|else|import|from|export|default|public|static|class|void|throws|extends|implements|try|catch|case|switch|while|for|do|in|as|new|typeof|await|async)$/.test(part))
            return <span key={i} className={syntaxColors.keyword}>{part}</span>;
          if (/^\d+$/.test(part))
            return <span key={i} className={syntaxColors.number}>{part}</span>;
          if (/^[(){}[\]]$/.test(part))
            return <span key={i} className={syntaxColors.bracket}>{part}</span>;
          if (/^(?:fetch|api|api_url|token|requests|post|get|json|exec|init|close|curl_init|curl_setopt|curl_exec|curl_close|println|print|send|then|JSON\.stringify|HttpClient|HttpRequest|HttpResponse|BodyPublishers|ofString|BodyHandlers)$/.test(part))
            return <span key={i} className={syntaxColors.function}>{part}</span>;

          return <span key={i}>{part}</span>;
        })}
      </code>
    );
  };

  const getCodeSnippet = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = data?.api_token || "YOUR_API_TOKEN";

    switch (activeLang) {
      case "python":
        return `import requests

url = "${apiUrl}/api/send"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}
data = {
    "phone": "9647XXXXXXXX",
    "name": "أحمد",
    "code": "123456"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`;
      case "js":
        return `fetch("${apiUrl}/api/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "phone": "9647XXXXXXXX",
    "name": "أحمد",
    "code": "123456"
  })
})
.then(res => res.json())
.then(data => console.log(data));`;
      case "php":
        return `<?php
$url = "${apiUrl}/api/send";
$headers = [
    "Authorization: Bearer ${token}",
    "Content-Type: application/json"
];
$data = [
    "phone" => "9647XXXXXXXX",
    "name" => "أحمد",
    "code" => "123456"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`;
      case "java":
        return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        var client = HttpClient.newHttpClient();
        var request = HttpRequest.newBuilder()
            .uri(URI.create("${apiUrl}/api/send"))
            .header("Authorization", "Bearer ${token}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(
                "{\\"phone\\":\\"9647XXXXXXXX\\",\\"name\\":\\"أحمد\\",\\"code\\":\\"123456\\"}"
            ))
            .build();

        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`;
      default:
        return `curl -X POST ${apiUrl}/api/send \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "9647XXXXXXXX",
    "name": "أحمد",
    "code": "123456"
  }'
`;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-slate-400">
          Use this token to authenticate your requests. Keep it secret!
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Your API Token
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type={showToken ? "text" : "password"}
              readOnly
              value={loading ? "Loading..." : data?.api_token || ""}
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-sm text-slate-300 outline-none w-full sm:w-auto"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowToken(!showToken)}
                disabled={!data}
                className="flex-1 sm:flex-none rounded-md bg-slate-800 px-4 py-2 text-sm font-bold transition-colors hover:bg-slate-700 disabled:opacity-60"
              >
                {showToken ? "Hide" : "Show"}
              </button>
              <button
                onClick={handleCopy}
                disabled={!data}
                className="flex-1 sm:flex-none rounded-md bg-slate-800 px-4 py-2 text-sm font-bold transition-colors hover:bg-slate-700 disabled:opacity-60"
              >
                Copy
              </button>
              <button
                onClick={handleRegenerate}
                className="flex-1 sm:flex-none rounded-md bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/20"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-500">
          Regenerating your token will invalidate the old one immediately. All
          your current integrations will stop working.
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Plan</p>
            <p className="font-semibold capitalize text-slate-100">
              {data?.plan || "-"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Monthly quota</p>
            <p className="font-semibold text-slate-100">
              {data?.monthly_quota ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Used this month</p>
            <p className="font-semibold text-slate-100">
              {data?.messages_sent_month ?? "-"}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">API Documentation</h3>
          <div className="flex gap-2 rounded-lg bg-slate-900 p-1 border border-slate-800 overflow-x-auto w-full sm:w-auto scrollbar-hide">
            {["curl", "python", "js", "php", "java"].map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`rounded-md px-3 py-1 text-xs font-bold uppercase transition-all ${activeLang === lang
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-relaxed">
          <button
            onClick={() => {
              const code = getCodeSnippet();
              navigator.clipboard.writeText(code);
            }}
            className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-xs font-bold border border-slate-700"
          >
            Copy Code
          </button>
          <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            <HighlightedCode code={getCodeSnippet()} />
          </pre>
        </div>
      </div>
    </div>
  );
}

