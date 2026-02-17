import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("wars")
    .select(
      "id, attack_power, defense_power, status, result, resolution_note, created_at, attacker_city:cities!wars_attacker_city_id_fkey(name), defender_city:cities!wars_defender_city_id_fkey(name)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wars: data ?? [] });
}
