"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Mission = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  link?: string;
};

type MissionsData = {
  cityRole: string | null;
  missions: Mission[];
  completedCount: number;
  totalCount: number;
};

const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  lord:        { label: "เจ้าเมือง",          icon: "👑", color: "text-amber-700 bg-amber-50 border-amber-200" },
  city_dept:   { label: "กรมเมือง",           icon: "📜", color: "text-blue-700 bg-blue-50 border-blue-200" },
  palace_dept: { label: "กรมวัง",            icon: "🏛️", color: "text-purple-700 bg-purple-50 border-purple-200" },
  chronicler:  { label: "คนสรุปเรื่องราว", icon: "📖", color: "text-green-700 bg-green-50 border-green-200" },
};

export default function MissionsPage() {
  const [data, setData] = useState<MissionsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/missions")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"));
  }, []);

  if (error) {
    return (
      <section className="siam-card">
        <p className="text-sm text-crimson">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="siam-card">
        <p className="text-sm text-ink/60">กำลังโหลด...</p>
      </section>
    );
  }

  const roleInfo = data.cityRole ? ROLE_LABELS[data.cityRole] : null;
  const progressPct = data.totalCount > 0 ? Math.round((data.completedCount / data.totalCount) * 100) : 0;

  return (
    <section className="space-y-3">
      <header className="siam-card">
        <h1 className="siam-title">ภารกิจของฉัน</h1>
        {roleInfo && (
          <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${roleInfo.color}`}>
            <span>{roleInfo.icon}</span>
            <span>บทบาท: {roleInfo.label}</span>
          </div>
        )}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-ink/70">
            <span>ความคืบหน้า</span>
            <span>{data.completedCount}/{data.totalCount} ภารกิจ ({progressPct}%)</span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gold/20">
            <div
              className="h-full rounded-full bg-crimson transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="space-y-2">
        {data.missions.map((mission) => (
          <article
            key={mission.id}
            className={`siam-card flex gap-3 transition ${mission.done ? "opacity-75" : ""}`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {mission.done ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
                  <span className="text-xs font-bold">✓</span>
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-gold/50 bg-white/60" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className={`text-sm font-semibold ${mission.done ? "text-ink/50 line-through" : "text-ink"}`}>
                {mission.title}
              </p>
              <p className="text-xs text-ink/60">{mission.description}</p>
              {!mission.done && mission.link && (
                <Link
                  href={mission.link}
                  className="inline-block rounded-lg bg-crimson/90 px-3 py-1 text-xs font-medium text-parchment hover:bg-crimson"
                >
                  ไปทำภารกิจ →
                </Link>
              )}
              {mission.done && (
                <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  เสร็จแล้ว ✓
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {data.completedCount === data.totalCount && data.totalCount > 0 && (
        <div className="siam-card border-gold bg-gold/10 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 text-sm font-bold text-crimson">ทำภารกิจครบทุกข้อแล้ว!</p>
          <p className="text-xs text-ink/60">เมืองของคุณพร้อมสำหรับการเรียนรู้ประวัติศาสตร์สยาม</p>
        </div>
      )}
    </section>
  );
}
