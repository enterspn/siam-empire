import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [resourcesRes, settingsRes, cityRes] = await Promise.all([
    supabaseService
      .from("city_resources")
      .select("amount, resource_type_id, resource_types(id, key, label, icon, sort_order)")
      .eq("city_id", session.city_id)
      .order("resource_types(sort_order)", { ascending: true }),
    supabaseService.from("settings").select("current_phase, is_trade_active, is_war_active").eq("id", 1).single(),
    supabaseService.from("cities").select("defense_score, stability_score").eq("id", session.city_id).single(),
  ]);

  if (resourcesRes.error) {
    return NextResponse.json({ error: resourcesRes.error.message }, { status: 500 });
  }

  const resources = (resourcesRes.data ?? []).map((r: Record<string, unknown>) => {
    const rt = r.resource_types as Record<string, unknown> | null;
    return {
      id: rt?.id ?? "",
      key: rt?.key ?? "unknown",
      label: rt?.label ?? "Unknown",
      icon: rt?.icon ?? "",
      amount: r.amount as number,
      war_effect: (rt?.war_effect as string) ?? null,
      war_multiplier: Number(rt?.war_multiplier) || 0,
    };
  });

  const settings = (settingsRes.data ?? {}) as Record<string, unknown>;
  if (settings.war_reparation_percent === undefined) settings.war_reparation_percent = 10;

  return NextResponse.json({
    cityName: session.city_name,
    resources,
    settings: { current_phase: "peace", is_trade_active: true, is_war_active: false, ...settings },
    cityStats: cityRes.data ?? { defense_score: 0, stability_score: 0 },
  });
}
