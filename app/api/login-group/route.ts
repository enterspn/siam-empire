import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const groupCode = (body.groupCode ?? "").trim().toLowerCase();

    if (!groupCode) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสกลุ่ม" },
        { status: 400 },
      );
    }

    const { data: city, error } = await supabaseService
      .from("cities")
      .select("id, name, group_code")
      .eq("group_code", groupCode)
      .single();

    if (error || !city) {
      return NextResponse.json(
        { error: "ไม่พบรหัสกลุ่มนี้ กรุณาลองใหม่" },
        { status: 404 },
      );
    }

    await setSession({
      city_id: city.id,
      city_name: city.name,
      role: "student",
    });

    return NextResponse.json({ ok: true, cityName: city.name });
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
