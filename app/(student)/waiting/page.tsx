"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function WaitingPage() {
  const router = useRouter();
  const [cityName, setCityName] = useState("");
  const [cityId, setCityId] = useState("");
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.cityId) setCityId(d.cityId);
        if (d.cityName) setCityName(d.cityName);
        if (d.resourcesReleased) router.replace("/dashboard");
      });
  }, [router]);

  useEffect(() => {
    if (!cityId) return;

    const channel = supabase
      .channel(`city-release-${cityId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cities", filter: `id=eq.${cityId}` },
        (payload) => {
          if (payload.new && (payload.new as { resources_released?: boolean }).resources_released) {
            router.replace("/dashboard");
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cityId, router]);

  return (
    <main className="siam-shell flex min-h-screen flex-col items-center justify-center">
      <section className="siam-card w-full max-w-sm text-center">
        <div className="mb-4 text-6xl animate-pulse">⏳</div>
        <h1 className="siam-title">รอครูปล่อยทรัพยากร</h1>
        {cityName && (
          <p className="mt-2 text-sm font-semibold text-crimson">{cityName}</p>
        )}
        <p className="mt-3 text-sm text-ink/70">
          ครูกำลังจัดสรรทรัพยากรและสินทรัพย์พิเศษ
          <br />
          กรุณารอสักครู่{dots}
        </p>
        <div className="mt-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-crimson/60 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-ink/40">หน้านี้จะอัปเดตอัตโนมัติเมื่อครูกด Release</p>
      </section>
    </main>
  );
}
