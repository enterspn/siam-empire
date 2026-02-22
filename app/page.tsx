"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLES = [
  { value: "lord",        label: "เจ้าเมือง",          icon: "👑" },
  { value: "city_dept",   label: "กรมเมือง",           icon: "📜" },
  { value: "palace_dept", label: "กรมวัง",            icon: "🏛️" },
  { value: "chronicler",  label: "คนสรุปเรื่องราว", icon: "📖" },
] as const;

const UNIQUE_ASSETS = ["ตราพระราชสีห์", "ยาสมุนไพร", "ไม้สัก", "เครื่องเทศ", "หยก", "ดีบุก"];

type Slot = { id: string; name: string; slot_number: number; is_registered: boolean };
type CityRole = typeof ROLES[number]["value"];

export default function HomePage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);

  const [cityName, setCityName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [cityRole, setCityRole] = useState<CityRole | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchSlots() {
    const r = await fetch("/api/city-slots", { cache: "no-store" });
    const d = await r.json();
    setSlots(d.slots ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchSlots(); }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/city-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotNumber: selected?.slot_number, cityName, passcode, cityRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
      router.push("/waiting");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="siam-shell">
      <section className="siam-card text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-gold">เกมจำลองอาณาจักร</p>
        <h1 className="siam-title text-3xl">Siam Empire</h1>
        <p className="mt-2 text-sm text-ink/70">เลือกช่องว่างเพื่อลงทะเบียนเมืองของกลุ่มคุณ</p>
      </section>

      <section className="space-y-2">
        {loading && <p className="siam-card text-center text-sm text-ink/50">กำลังโหลด...</p>}
        {slots.map((slot) => (
          <button
            key={slot.id}
            disabled={slot.is_registered}
            onClick={() => { setSelected(slot); setError(""); setCityName(""); setPasscode(""); setCityRole(""); }}
            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
              slot.is_registered
                ? "border-gold/40 bg-gold/10 cursor-not-allowed"
                : "border-crimson/40 bg-white/80 hover:bg-crimson/5 cursor-pointer"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">ช่องที่ {slot.slot_number}</p>
                <p className={`mt-0.5 text-base font-bold ${slot.is_registered ? "text-crimson" : "text-ink/30"}`}>
                  {slot.is_registered ? slot.name : "ว่าง — คลิกเพื่อลงทะเบียน"}
                </p>
              </div>
              <span className="text-2xl">{slot.is_registered ? "🏰" : "➕"}</span>
            </div>
          </button>
        ))}
      </section>

      <div className="siam-card text-center">
        <p className="mb-2 text-xs text-ink/60">เคยลงทะเบียนแล้ว? ใช้ PIN เข้าสู่ระบบ</p>
        <Link href="/login" className="siam-button inline-block px-6 text-sm">เข้าสู่ระบบด้วย PIN</Link>
        <Link href="/admin" className="mt-2 block text-xs text-crimson underline">แผงควบคุมครู</Link>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-parchment p-5 shadow-xl">
            <h2 className="siam-title text-lg">ลงทะเบียนช่องที่ {selected.slot_number}</h2>
            <form onSubmit={handleRegister} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink">ชื่อเมือง</label>
                <input
                  value={cityName} onChange={(e) => setCityName(e.target.value)}
                  placeholder="เช่น สุโขทัย"
                  className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink">รหัส PIN (4 หลัก)</label>
                <input
                  value={passcode} onChange={(e) => setPasscode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234" inputMode="numeric" maxLength={4}
                  className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-center text-lg font-bold tracking-[0.5em] outline-none ring-crimson/40 focus:ring"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">บทบาทของคุณ</p>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  {ROLES.map((r) => (
                    <label key={r.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-xs transition ${cityRole === r.value ? "border-crimson bg-crimson/10 font-semibold" : "border-gold/40 bg-white/60"}`}>
                      <input type="radio" name="role" value={r.value} checked={cityRole === r.value} onChange={() => setCityRole(r.value)} className="accent-crimson" />
                      <span>{r.icon} {r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="rounded-lg bg-crimson/10 px-3 py-2 text-xs font-medium text-crimson">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-gold/40 py-2 text-sm font-semibold text-ink/70">ยกเลิก</button>
                <button type="submit" disabled={submitting || !cityName.trim() || passcode.length !== 4 || !cityRole}
                  className="siam-button flex-1 disabled:opacity-50 text-sm">
                  {submitting ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
