"use client";

import { useEffect, useState } from "react";

type CityInfo = {
  id: string;
  name: string;
  group_code: string;
  description: string;
  laws: string;
  materials: string;
  culture: string;
  leader_name: string;
  story_log: string;
};

type LawItem = {
  id: string;
  title: string;
  description: string;
  bonus_type: string | null;
  bonus_value: number | null;
  status: string;
  created_at: string;
};

export default function CityInfoPage() {
  const [city, setCity] = useState<CityInfo | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [leaderName, setLeaderName] = useState("");
  const [description, setDescription] = useState("");
  const [laws, setLaws] = useState("");
  const [materials, setMaterials] = useState("");
  const [culture, setCulture] = useState("");
  const [storyLog, setStoryLog] = useState("");

  const [lawList, setLawList] = useState<LawItem[]>([]);
  const [lawTitle, setLawTitle] = useState("");
  const [lawDescription, setLawDescription] = useState("");
  const [lawBonusType, setLawBonusType] = useState<"attack_pct" | "defense_pct">("attack_pct");
  const [lawBonusValue, setLawBonusValue] = useState("10");
  const [lawSubmitting, setLawSubmitting] = useState(false);
  const [lawMessage, setLawMessage] = useState("");

  function loadCityAndLaws() {
    fetch("/api/student/city-info")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else if (d.city) {
          setCity(d.city);
          setLeaderName(d.city.leader_name ?? "");
          setDescription(d.city.description ?? "");
          setLaws(d.city.laws ?? "");
          setMaterials(d.city.materials ?? "");
          setCulture(d.city.culture ?? "");
          setStoryLog(d.city.story_log ?? "");
        }
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"));
    fetch("/api/student/laws")
      .then((r) => r.json())
      .then((d) => setLawList(d.laws ?? []))
      .catch(() => setLawList([]));
  }

  useEffect(() => {
    loadCityAndLaws();
  }, []);

  async function handleLawSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLawMessage("");
    setLawSubmitting(true);
    try {
      const res = await fetch("/api/student/laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lawTitle.trim(),
          description: lawDescription.trim(),
          bonus_type: lawBonusType,
          bonus_value: Number(lawBonusValue) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLawMessage(data.error ?? "ส่งไม่สำเร็จ");
        return;
      }
      setLawTitle("");
      setLawDescription("");
      setLawBonusValue("10");
      setLawMessage("ส่งเสนอกฎหมายแล้ว รอครูอนุมัติ");
      loadCityAndLaws();
    } catch {
      setLawMessage("ไม่สามารถเชื่อมต่อได้");
    } finally {
      setLawSubmitting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/student/city-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leader_name: leaderName,
          description,
          laws,
          materials,
          culture,
          story_log: storyLog,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  }

  if (error && !city) {
    return (
      <section className="siam-card">
        <p className="text-sm text-crimson">{error}</p>
      </section>
    );
  }

  if (!city) {
    return (
      <section className="siam-card">
        <p className="text-sm text-ink/60">กำลังโหลด...</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <header className="siam-card">
        <h1 className="siam-title">ข้อมูลเมือง {city.name}</h1>
        <p className="mt-1 text-xs text-ink/60">กรอกข้อมูลเมืองของกลุ่มคุณ</p>
      </header>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="siam-card space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-ink">ชื่อผู้นำเมือง</span>
            <input
              type="text"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="เช่น พ่อขุนรามคำแหง"
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">คำอธิบายเมือง</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายลักษณะเมืองของคุณ..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">กฎหมาย (ข้อความ)</span>
            <textarea
              value={laws}
              onChange={(e) => setLaws(e.target.value)}
              placeholder="กฎหมายหรือกฎระเบียบของเมือง..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
          </label>

          {/* กฎหมายที่มีผลเชิงกล – แสดงอนุมัติแล้วด้านบน */}
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-3">
            <span className="text-sm font-semibold text-crimson">📜 กฎหมายที่มีผลเชิงกล (โจมตี/ป้องกัน %)</span>
            <p className="mt-1 text-xs text-ink/60">เมื่อครูอนุมัติ โบนัสจะถูกนำไปคำนวณตอนรบจริง</p>
            {lawList.filter((l) => l.status === "approved").length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-semibold text-green-800">✓ กฎหมายที่อนุมัติแล้ว (แสดงด้านบน)</p>
                {lawList
                  .filter((l) => l.status === "approved")
                  .map((l) => (
                    <div key={l.id} className="rounded-lg border border-green-200 bg-green-50/80 p-2">
                      <p className="text-sm font-medium text-ink">{l.title}</p>
                      <p className="text-xs text-ink/60">
                        โบนัส: {l.bonus_type === "attack_pct" ? "โจมตี" : "ป้องกัน"} +{l.bonus_value ?? 0}%
                      </p>
                    </div>
                  ))}
              </div>
            )}
            {lawList.filter((l) => l.status === "pending").length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-ink/70">รออนุมัติ</p>
                {lawList
                  .filter((l) => l.status === "pending")
                  .map((l) => (
                    <p key={l.id} className="text-xs text-ink/60">
                      {l.title} – {l.bonus_type === "attack_pct" ? "โจมตี" : "ป้องกัน"} +{l.bonus_value ?? 0}%
                    </p>
                  ))}
              </div>
            )}
            <form onSubmit={handleLawSubmit} className="mt-3 space-y-2 border-t border-gold/30 pt-3">
              <input
                type="text"
                value={lawTitle}
                onChange={(e) => setLawTitle(e.target.value)}
                placeholder="ชื่อกฎหมาย"
                className="w-full rounded-lg border border-gold/40 bg-white/80 px-2 py-1.5 text-sm"
                required
              />
              <textarea
                value={lawDescription}
                onChange={(e) => setLawDescription(e.target.value)}
                placeholder="คำอธิบาย (ไม่บังคับ)"
                rows={2}
                className="w-full rounded-lg border border-gold/40 bg-white/80 px-2 py-1.5 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={lawBonusType}
                  onChange={(e) => setLawBonusType(e.target.value as "attack_pct" | "defense_pct")}
                  className="rounded-lg border border-gold/40 bg-white/80 px-2 py-1.5 text-sm"
                >
                  <option value="attack_pct">โจมตี +%</option>
                  <option value="defense_pct">ป้องกัน +%</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={lawBonusValue}
                  onChange={(e) => setLawBonusValue(e.target.value)}
                  className="w-16 rounded-lg border border-gold/40 bg-white/80 px-2 py-1.5 text-sm"
                />
                <span className="text-xs text-ink/60">%</span>
                <button
                  type="submit"
                  disabled={lawSubmitting}
                  className="rounded-lg bg-crimson px-3 py-1.5 text-xs font-medium text-parchment disabled:opacity-50"
                >
                  {lawSubmitting ? "กำลังส่ง..." : "เสนอกฎหมาย"}
                </button>
              </div>
              {lawMessage && (
                <p className={`text-xs ${lawMessage.includes("สำเร็จ") ? "text-green-700" : "text-crimson"}`}>{lawMessage}</p>
              )}
            </form>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-ink">วัสดุ/ทรัพยากรพิเศษ</span>
            <textarea
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="วัสดุหรือทรัพยากรที่เมืองมี..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">วัฒนธรรม/ประเพณี</span>
            <textarea
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              placeholder="วัฒนธรรมหรือประเพณีของเมือง..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">📖 บันทึกประวัติศาสตร์ (คนสรุปเรื่องราว)</span>
            <p className="mb-1 text-xs text-ink/60">เขียนเก็บบันทึกเหตุการณ์สำคัญ การเจรจา สงคราม และความเป็นไปของเมือง</p>
            <textarea
              value={storyLog}
              onChange={(e) => setStoryLog(e.target.value)}
              placeholder="วันนี้เมืองของเราได้..."
              rows={5}
              className="mt-1 w-full rounded-xl border border-gold/40 bg-white/80 px-3 py-2 text-sm outline-none ring-crimson/40 focus:ring"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson">{error}</p>
        )}

        {saved && (
          <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">บันทึกสำเร็จ!</p>
        )}

        <button type="submit" disabled={saving} className="siam-button w-full disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </form>
    </section>
  );
}
