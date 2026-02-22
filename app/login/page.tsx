"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "lord",        label: "เจ้าเมือง",          icon: "👑" },
  { value: "city_dept",   label: "กรมเมือง",           icon: "📜" },
  { value: "palace_dept", label: "กรมวัง",            icon: "🏛️" },
  { value: "chronicler",  label: "คนสรุปเรื่องราว", icon: "📖" },
] as const;

type CityRole = typeof ROLES[number]["value"];

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [cityRole, setCityRole] = useState<CityRole | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, cityRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
      router.push(data.resourcesReleased ? "/dashboard" : "/waiting");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="siam-shell">
      <section className="siam-card">
        <h1 className="siam-title">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-ink/75">กรอกรหัส PIN 4 หลักที่ตั้งไว้ตอนลงทะเบียน</p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-ink">รหัส PIN (4 หลัก)</label>
            <input
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="• • • •"
              inputMode="numeric"
              maxLength={4}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none ring-crimson/40 focus:ring"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">เลือกบทบาทของคุณ</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label key={r.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${cityRole === r.value ? "border-crimson bg-crimson/10" : "border-gold/40 bg-white/60 hover:bg-gold/10"}`}>
                  <input type="radio" name="cityRole" value={r.value} checked={cityRole === r.value} onChange={() => setCityRole(r.value)} className="accent-crimson" />
                  <span className="text-base">{r.icon}</span>
                  <span className="text-xs font-semibold text-ink">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">{error}</p>}

          <button type="submit" disabled={loading || passcode.length !== 4 || !cityRole} className="siam-button w-full disabled:opacity-50">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink/50">
          ยังไม่ลงทะเบียน?{" "}
          <a href="/" className="font-semibold text-crimson underline">กลับหน้าแรก</a>
        </p>
      </section>
    </main>
  );
}
