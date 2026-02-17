"use client";

import { useEffect, useState } from "react";

type City = { id: string; name: string };
type Resource = {
  id: string;
  key: string;
  label: string;
  icon: string;
  amount: number;
  war_effect: string | null;
  war_multiplier: number;
};

export default function WarPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [defenderCityId, setDefenderCityId] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState<{ attackPower: number; defensePower: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const attackResources = resources.filter((r) => r.war_effect === "attack");

  useEffect(() => {
    Promise.all([
      fetch("/api/student/trade-options").then((r) => r.json()),
      fetch("/api/student/dashboard").then((r) => r.json()),
    ]).then(([opt, dash]) => {
      setCities(opt.cities ?? []);
      setResources(dash.resources ?? []);
    });
  }, []);

  const previewAttack = () => {
    let sum = 0;
    for (const r of attackResources) {
      const amt = Number(amounts[r.id]) || 0;
      sum += amt * (r.war_multiplier || 0);
    }
    return sum;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResult(null);
    setLoading(true);

    const payload: Record<string, number> = {};
    let hasAny = false;
    for (const r of attackResources) {
      const amt = Math.floor(Number(amounts[r.id]) || 0);
      if (amt > 0) {
        if (amt > r.amount) {
          setError(`จำนวน ${r.label} สูงกว่าที่มี (${r.amount})`);
          setLoading(false);
          return;
        }
        payload[r.id] = amt;
        hasAny = true;
      }
    }
    if (!hasAny) {
      setError("กรุณาเลือกจำนวนทรัพยากรที่จะส่งเข้ารบอย่างน้อย 1 ชนิด");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/wars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defenderCityId,
          resources: payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }

      setResult({ attackPower: data.attackPower, defensePower: data.defensePower });
      setSuccess("ส่งคำขอสงครามสำเร็จ! ระบบคำนวณแต้มจากตัวคูณแล้ว รอครูตัดสิน และทรัพยากรจะถูกหักหลังรบ");
      setDefenderCityId("");
      setAmounts({});
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 outline-none ring-crimson/40 focus:ring";

  return (
    <section className="siam-card">
      <h1 className="siam-title">ประกาศสงคราม</h1>
      <p className="mt-1 text-sm text-ink/75">
        เลือกจำนวนทรัพยากร (ชนิดโจมตี) ที่จะส่งเข้ารบ → ระบบคำนวณแต้มจากตัวคูณ → เปรียบกับพลังป้องกันของเมืองเป้าหมาย
        ทรัพยากรจะถูกหักหลังครูตัดสินรบ
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">เมืองเป้าหมาย</label>
          <select
            value={defenderCityId}
            onChange={(e) => setDefenderCityId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">-- เลือกเมืองเป้าหมาย --</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {attackResources.length === 0 && (
          <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
            ยังไม่มีทรัพยากรชนิด &quot;โจมตี&quot; ครูสามารถตั้งค่าในแท็บ 📦 ทรัพยากร ได้
          </p>
        )}

        {attackResources.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">ทรัพยากรที่ส่งเข้ารบ (โจมตี)</label>
            {attackResources.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <span className="w-8 text-xl">{r.icon}</span>
                <span className="min-w-[80px] text-sm text-ink/80">{r.label}</span>
                <span className="text-xs text-ink/50">(มี {r.amount}) ตัวคูณ: {r.war_multiplier}</span>
                <input
                  type="number"
                  min="0"
                  max={r.amount}
                  value={amounts[r.id] ?? ""}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="w-24 rounded-xl border border-gold/40 bg-white/80 px-2 py-1 text-sm"
                  placeholder="0"
                />
              </div>
            ))}
            <p className="text-sm text-ink/60">
              พลังโจมตี ( preview ): <strong>{previewAttack()}</strong> แต้ม
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">{success}</p>
        )}

        {result && (
          <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm">
            <p>⚔️ พลังโจมตี: <strong>{result.attackPower}</strong></p>
            <p>🛡️ พลังป้องกัน (เมืองเป้าหมาย): <strong>{result.defensePower}</strong></p>
            <p className="mt-1 text-xs text-ink/60">ผลลัพธ์จะถูกตัดสินโดยครู ทรัพยากรที่ส่งจะถูกหักหลังตัดสิน</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || attackResources.length === 0}
          className="siam-button w-full disabled:opacity-50"
        >
          {loading ? "กำลังส่ง..." : "ประกาศสงคราม"}
        </button>
      </form>
    </section>
  );
}
