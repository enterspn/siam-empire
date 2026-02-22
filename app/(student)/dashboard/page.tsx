"use client";

import { useEffect, useState } from "react";
import { RoyalDecreeBanner } from "@/components/royal-decree-banner";

type Resource = { key: string; label: string; icon: string; amount: number; war_effect?: string | null; war_multiplier?: number };
type Settings = { current_phase: string; is_trade_active: boolean; is_war_active: boolean };
type CityStats = { defense_score: number; stability_score: number };
type DashboardData = {
  cityName: string;
  resources: Resource[];
  settings: Settings;
  cityStats: CityStats;
};

type NegotiationGuide = {
  negotiation_goal: string;
  my_products: { id: string; label: string; icon: string | null; key: string }[];
  missing_products: { id: string; label: string; icon: string | null; key: string }[];
  other_cities: { id: string; name: string; products: { id: string; label: string; icon: string | null; key: string }[] }[];
  suggestions: { resource: { id: string; label: string; icon: string | null }; city_id: string; city_name: string }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [guide, setGuide] = useState<NegotiationGuide | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"));
    fetch("/api/student/negotiation-guide")
      .then((r) => r.json())
      .then((d) => setGuide(d))
      .catch(() => setGuide(null));
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

  const settings = data.settings ?? { current_phase: "peace", is_trade_active: false, is_war_active: false };
  const cityStats = data.cityStats ?? { defense_score: 0, stability_score: 0 };
  const resources = Array.isArray(data.resources) ? data.resources : [];

  return (
    <section className="space-y-3">
      <RoyalDecreeBanner cityResources={resources.map((r) => ({ key: r.key, amount: r.amount }))} />

      <header className="siam-card">
        <h1 className="siam-title">หน้าหลักเมือง</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-gold/20 px-2 py-0.5 font-semibold text-ink">
            ช่วงเวลา: {settings.current_phase === "peace" ? "☮️ สันติภาพ" : "⚔️ สงคราม"}
          </span>
          <span className="rounded-full bg-crimson/10 px-2 py-0.5 font-semibold text-crimson">
            การป้องกัน: {cityStats.defense_score}
          </span>
          <span className="rounded-full bg-gold/10 px-2 py-0.5 font-semibold text-ink">
            เสถียรภาพ: {cityStats.stability_score}
          </span>
        </div>
      </header>

      {guide && (
        <section className="siam-card space-y-3">
          <h2 className="text-sm font-bold text-crimson">📋 คู่มือการเจรจา</h2>
          {guide.negotiation_goal && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2">
              <p className="text-xs font-semibold text-amber-900">เป้าหมายการเจรจา (ถ้าไม่ได้ สามารถประกาศสงครามได้)</p>
              <p className="mt-1 text-sm text-ink">{guide.negotiation_goal}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-ink/80">สินค้าที่กลุ่มคุณมี (ครูกำหนด 2 อย่าง)</p>
            <p className="mt-1 text-sm text-ink">
              {guide.my_products.length >= 2
                ? guide.my_products.map((p) => `${p.icon ?? "📦"} ${p.label}`).join(", ")
                : "ครูยังไม่ได้ตั้งค่า สินค้าของกลุ่มคุณ"}
            </p>
          </div>
          {guide.missing_products.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink/80">สิ่งที่กลุ่มคุณยังขาด (ไปเจรจาขอจากกลุ่มอื่น)</p>
              <p className="mt-1 text-sm text-ink">
                {guide.missing_products.map((p) => `${p.icon ?? "📦"} ${p.label}`).join(", ")}
              </p>
            </div>
          )}
          {guide.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink/80">แนะนำ: ไปเจรจากับกลุ่มไหนเพื่อให้ได้สิ่งที่ขาด</p>
              <ul className="mt-1 space-y-1 text-sm text-ink">
                {guide.suggestions.map((s, i) => (
                  <li key={i}>
                    ได้ <span className="font-medium">{s.resource.icon ?? "📦"} {s.resource.label}</span> → ไปเจรจากับ <span className="font-semibold text-crimson">{s.city_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guide.other_cities.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-ink/70">ดูว่าทุกกลุ่มมีสินค้าอะไรบ้าง</summary>
              <ul className="mt-1 space-y-1 text-xs text-ink/60">
                {guide.other_cities.map((oc) => (
                  <li key={oc.id}>
                    <strong>{oc.name}</strong>: {oc.products.length >= 2 ? oc.products.map((p) => `${p.icon ?? ""} ${p.label}`).join(", ") : "ยังไม่มี"}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {/* แสดงแค่สินค้าที่มีให้ (จำนวน > 0) และคะแนนโจมตี */}
      {(() => {
        const hasProducts = resources.filter((r) => (r?.amount ?? 0) > 0);
        const attackScore = resources.reduce((sum, r) => {
          if (r?.war_effect === "attack" && (r?.amount ?? 0) > 0) return sum + (r.amount ?? 0) * (r.war_multiplier ?? 1);
          return sum;
        }, 0);
        return (
          <>
            <section className="siam-card">
              <h2 className="mb-2 text-sm font-bold text-crimson">สินค้าที่มีให้</h2>
              {hasProducts.length === 0 ? (
                <p className="text-sm text-ink/50">ยังไม่มีสินค้า (ครูกำหนดจำนวนในแผงครู)</p>
              ) : (
                <ul className="space-y-2">
                  {hasProducts.map((r) => (
                    <li key={r.key} className="flex items-center justify-between rounded-lg border border-gold/30 bg-white/60 px-3 py-2">
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-sm font-medium text-ink/80">{r.label}</span>
                      <span className="text-lg font-bold text-crimson">{r.amount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="siam-card">
              <h2 className="mb-1 text-sm font-bold text-crimson">คะแนนโจมตี</h2>
              <p className="text-2xl font-bold text-crimson">{attackScore}</p>
              <p className="mt-0.5 text-xs text-ink/50">คำนวณจากทรัพยากรชนิดโจมตี × ตัวคูณ (ใช้ตอนประกาศสงคราม)</p>
            </section>
          </>
        );
      })()}
    </section>
  );
}
