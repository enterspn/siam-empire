import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.city_id === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("cities")
    .select("id, name, group_code, description, laws, materials, culture, leader_name, story_log")
    .eq("id", session.city_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ city: data });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.city_id === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const allowed = ["description", "laws", "materials", "culture", "leader_name", "story_log"];
    const updates: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body && typeof body[key] === "string") {
        updates[key] = body[key].trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่จะบันทึก" }, { status: 400 });
    }

    const { error } = await supabaseService
      .from("cities")
      .update(updates)
      .eq("id", session.city_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const changedFields = Object.keys(updates).join(", ");
    await supabaseService.from("logs").insert({
      message: `${session.city_name} อัปเดตข้อมูลเมือง: ${changedFields}`,
      city_id: session.city_id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
