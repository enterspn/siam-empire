"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "lord",        label: "เจ้าเมือง",          icon: "👑", desc: "ตัดสินใจเชิงยุทธศาสตร์ ค้าขาย ประกาศสงคราม" },
  { value: "city_dept",   label: "กรมเมือง",           icon: "📜", desc: "จัดการทรัพยากร เสนอกฎหมาย บันทึกวัสดุ" },
  { value: "palace_dept", label: "กรมวัง",            icon: "🏛️", desc: "วัฒนธรรม ประเพณี คำอธิบายเมือง" },
  { value: "chronicler",  label: "คนสรุปเรื่องราว", icon: "📖", desc: "เขียนบันทึกประวัติศาสตร์ สรุปเหตุการณ์" },
] as const;

type CityRole = typeof ROLES[number]["value"];

export default function LoginPage() {
  const router = useRouter();
  const [groupCode, setGroupCode] = useState("");
  const [cityRole, setCityRole] = useState<CityRole | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCode, cityRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }

      router.push("/dashboard");
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
        <p className="mt-1 text-sm text-ink/75">กรอกรหัสกลุ่มและเลือกบทบาทของคุณ</p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="groupCode">
              รหัสกลุ่ม
            </label>
            <input
              id="groupCode"
              name="groupCode"
              placeholder="เช่น sukhothai, ayutthaya"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 outline-none ring-crimson/40 focus:ring"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">เลือกบทบาทของคุณ</p>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    cityRole === r.value
                      ? "border-crimson bg-crimson/10"
                      : "border-gold/40 bg-white/60 hover:bg-gold/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="cityRole"
                    value={r.value}
                    checked={cityRole === r.value}
                    onChange={() => setCityRole(r.value)}
                    className="mt-0.5 accent-crimson"
                  />
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{r.label}</p>
                    <p className="text-xs text-ink/60">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !groupCode.trim() || !cityRole}
            className="siam-button w-full disabled:opacity-50"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </section>
    </main>
  );
}
