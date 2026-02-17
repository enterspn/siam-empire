"use client";

import { useEffect, useState } from "react";

type LogEntry = {
  id: string;
  message: string;
  created_at: string;
  city: { name: string } | null;
};

export default function NewsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/news")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setLogs(d.logs ?? []);
      })
      .catch(() => setError("ไม่สามารถโหลดข่าวได้"));
  }, []);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "เมื่อสักครู่";
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    return `${Math.floor(hrs / 24)} วันที่แล้ว`;
  }

  return (
    <section className="siam-card">
      <h1 className="siam-title">ข่าวสารโลก</h1>

      {error && <p className="mt-2 text-sm text-crimson">{error}</p>}

      {!error && logs.length === 0 && (
        <p className="mt-3 text-sm text-ink/50">ยังไม่มีข่าว</p>
      )}

      <ul className="mt-3 space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="rounded-lg border border-gold/30 bg-white/60 px-3 py-2">
            <p className="text-sm">{log.message}</p>
            <p className="mt-0.5 text-xs text-ink/40">
              {log.city?.name && <span className="font-medium text-crimson/60">{log.city.name}</span>}
              {log.city?.name && " · "}
              {timeAgo(log.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
