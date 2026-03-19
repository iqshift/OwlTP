"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type MessageLog = {
  id: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
};

type PaginatedResponse = {
  items: MessageLog[];
  total: number;
  page: number;
  page_size: number;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLogs = async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse>("/api/logs", {
        params: {
          page: pageNum,
          page_size: pageSize,
          search: searchTerm || undefined,
        },
      });
      setLogs(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Logs</h1>
          <p className="text-slate-400">
            View the history of sent messages and their delivery status.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search phone or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1 text-sm outline-none focus:border-green-500"
          />
          <button
            onClick={() => {
              setPage(1);
              loadLogs(1, search);
            }}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm"
          >
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">Phone Number</th>
              <th className="px-6 py-4 font-medium">Message Body</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-center text-sm text-slate-500"
                >
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-center text-sm text-slate-500"
                >
                  No logs yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {log.phone}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-slate-400">
                    {log.message}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                        log.status === "sent"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          Page {page} of {totalPages} • {total} messages
        </div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

