"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type LogEntry = {
  id: string;
  message: string;
  created_at: string;
  city: { name: string } | null;
};

export function AdminLogFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLogs() {
    const r = await fetch("/api/admin/logs", { cache: "no-store" });
    const d = await r.json();
    if (d.logs) setLogs(d.logs);
    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("admin-logs-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "logs" },
        (payload) => {
          const newEntry = payload.new as { id: string; message: string; created_at: string; city_id: string | null };
          setLogs((prev) => [
            { id: newEntry.id, message: newEntry.message, created_at: newEntry.created_at, city: null },
            ...prev,
          ].slice(0, 100));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function getIcon(msg: string) {
    if (msg.includes("traded")) return "🤝";
    if (msg.includes("rejected")) return "❌";
    if (msg.includes("war") || msg.includes("War")) return "⚔️";
    if (msg.includes("law") || msg.includes("Law")) return "📜";
    if (msg.includes("donated") || msg.includes("contribute")) return "🌾";
    return "📋";
  }

  if (loading) return <p className="text-sm text-ink/50">กำลังโหลดล็อก...</p>;

  return (
    <div className="space-y-1.5">
      {logs.length === 0 && <p className="text-sm text-ink/40">ยังไม่มีกิจกรรม</p>}
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-2 rounded-xl border border-gold/20 bg-white/60 px-3 py-2">
          <span className="mt-0.5 text-base">{getIcon(log.message)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink">{log.message}</p>
            {log.city?.name && <p className="text-xs text-ink/50">เมือง: {log.city.name}</p>}
          </div>
          <span className="shrink-0 text-xs text-ink/40">{formatTime(log.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
