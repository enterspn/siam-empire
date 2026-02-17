import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cityId: string }> },
) {
  const session = await getSession();
  if (!session || session.city_id === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cityId } = await params;
  if (!cityId || cityId === session.city_id) {
    return NextResponse.json({ error: "ไม่สามารถดูกฎหมายเมืองตัวเองได้จากหน้านี้" }, { status: 400 });
  }

  const { data: city, error: cityErr } = await supabaseService
    .from("cities")
    .select("id, name, laws")
    .eq("id", cityId)
    .single();

  if (cityErr || !city) {
    return NextResponse.json({ error: "ไม่พบเมืองนี้" }, { status: 404 });
  }

  const { data: approvedLaws } = await supabaseService
    .from("laws")
    .select("id, title, description, bonus_type, bonus_value")
    .eq("city_id", cityId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    city: { name: (city as { name: string }).name, laws: (city as { laws: string }).laws ?? "" },
    approvedLaws: (approvedLaws ?? []).map((l) => ({
      id: (l as { id: string }).id,
      title: (l as { title: string }).title,
      description: (l as { description: string }).description,
      bonus_type: (l as { bonus_type: string | null }).bonus_type,
      bonus_value: (l as { bonus_value: number | null }).bonus_value,
    })),
  });
}
