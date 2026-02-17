import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("settings")
    .select("current_phase, is_trade_active, is_war_active")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings = (data ?? {}) as Record<string, unknown>;
  if (settings.war_reparation_percent === undefined) {
    settings.war_reparation_percent = 10;
  }
  return NextResponse.json({ settings });
}
