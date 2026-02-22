"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type GlobalMission = {
  id: string;
  title: string;
  description: string;
  target_resource_type: string;
  target_amount: number;
  current_amount: number;
  is_active: boolean;
};

const RESOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  rice:     { label: "ข้าว",   icon: "🌾" },
  weapons:  { label: "อาวุธ",  icon: "⚔️" },
  gold:     { label: "ทอง",    icon: "🪙" },
  soldiers: { label: "ทหาร",  icon: "🛡️" },
};

export function RoyalDecreeBanner({ cityResources }: { cityResources: { key: string; amount: number }[] }) {
  const [mission, setMission] = useState<GlobalMission | null>(null);
  const [amount, setAmount] = useState("1");
  const [donating, setDonating] = useState(false);
  const [message, setMessage] = useState("");
  const [resources, setResources] = useState(cityResources);

  useEffect(() => { setResources(cityResources); }, [cityResources]);

  useEffect(() => {
    fetch("/api/global-missions")
      .then((r) => r.json())
      .then((d) => { if (d.activeMission) setMission(d.activeMission); });
  }, []);

  useEffect(() => {
    if (!mission) return;
    const channel = supabase
      .channel(`global-mission-${mission.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "global_missions", filter: `id=eq.${mission.id}` },
        (payload) => {
          const updated = payload.new as GlobalMission;
          setMission((prev) => prev ? { ...prev, current_amount: updated.current_amount, is_active: updated.is_active } : prev);
          if (!updated.is_active) setMission(null);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mission?.id]);

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!mission) return;
    setDonating(true);
    setMessage("");
    try {
      const res = await fetch("/api/student/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: mission.id, amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error ?? "เกิดข้อผิดพลาด"); return; }
      setMessage(`✅ บริจาค ${data.donated} หน่วยสำเร็จ`);
      setResources((prev) =>
        prev.map((r) =>
          r.key === mission.target_resource_type ? { ...r, amount: data.newCityAmount } : r,
        ),
      );
      setAmount("1");
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setDonating(false);
    }
  }

  if (!mission) return null;

  const pct = Math.min(100, Math.round((mission.current_amount / mission.target_amount) * 100));
  const res = RESOURCE_LABELS[mission.target_resource_type] ?? { label: mission.target_resource_type, icon: "📦" };
  const cityHas = resources.find((r) => r.key === mission.target_resource_type)?.amount ?? 0;
  const completed = mission.current_amount >= mission.target_amount;

  return (
    <section className="rounded-2xl border-2 border-gold bg-gradient-to-br from-amber-900/10 via-parchment to-amber-100/40 p-4 shadow-lg">
      <div className="flex items-start gap-2">
        <span className="text-2xl">📜</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">พระราชโองการ</p>
          <h2 className="text-sm font-bold text-crimson">{mission.title}</h2>
          {mission.description && <p className="mt-0.5 text-xs text-ink/70">{mission.description}</p>}
        </div>
        {completed && <span className="text-2xl">🏆</span>}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-ink/70">
          <span>{res.icon} {res.label}: {mission.current_amount.toLocaleString()} / {mission.target_amount.toLocaleString()}</span>
          <span className="font-bold text-crimson">{pct}%</span>
        </div>
        <div className="mt-1.5 h-4 w-full overflow-hidden rounded-full bg-gold/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-crimson to-amber-600 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {!completed && (
        <form onSubmit={handleDonate} className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <p className="mb-1 text-xs text-ink/60">เมืองคุณมี {res.icon} {cityHas.toLocaleString()} หน่วย</p>
            <input
              type="number"
              min="1"
              max={cityHas}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-1.5 text-sm outline-none ring-crimson/40 focus:ring"
            />
          </div>
          <button
            type="submit"
            disabled={donating || Number(amount) < 1 || Number(amount) > cityHas}
            className="rounded-xl bg-crimson px-4 py-2 text-xs font-bold text-parchment hover:bg-crimson/90 disabled:opacity-50"
          >
            {donating ? "..." : "บริจาค"}
          </button>
        </form>
      )}

      {message && (
        <p className={`mt-2 text-xs font-medium ${message.startsWith("✅") ? "text-green-700" : "text-crimson"}`}>
          {message}
        </p>
      )}

      {completed && (
        <p className="mt-2 text-center text-sm font-bold text-green-700">🎉 ภารกิจสำเร็จ! ขอบคุณทุกเมืองที่ร่วมมือ</p>
      )}
    </section>
  );
}
