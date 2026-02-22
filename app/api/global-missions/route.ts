import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const { data, error } = await supabaseService
    .from("global_missions")
    .select("id, title, description, target_resource_type, target_amount, current_amount, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const active = (data ?? []).find((m) => m.is_active) ?? null;
  return NextResponse.json({ missions: data ?? [], activeMission: active });
}
