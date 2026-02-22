import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const { data, error } = await supabaseService
    .from("cities")
    .select("id, name, slot_number, is_registered, resources_released, unique_asset")
    .not("slot_number", "is", null)
    .order("slot_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: data ?? [] });
}
