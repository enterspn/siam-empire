import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { toCityId, offerResourceTypeId, offerAmount, requestResourceTypeId, requestAmount, note } = body;

    if (!toCityId || !offerResourceTypeId || !offerAmount || offerAmount <= 0) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 },
      );
    }

    if (toCityId === session.city_id) {
      return NextResponse.json(
        { error: "ไม่สามารถค้าขายกับเมืองตัวเองได้" },
        { status: 400 },
      );
    }

    // Check if trade is active
    const { data: settings } = await supabaseService
      .from("settings")
      .select("is_trade_active")
      .eq("id", 1)
      .single();

    if (!settings?.is_trade_active) {
      return NextResponse.json(
        { error: "ระบบการค้าปิดอยู่ในขณะนี้" },
        { status: 403 },
      );
    }

    // Check sufficient resources
    const { data: resource } = await supabaseService
      .from("city_resources")
      .select("amount")
      .eq("city_id", session.city_id)
      .eq("resource_type_id", offerResourceTypeId)
      .single();

    if (!resource || resource.amount < offerAmount) {
      return NextResponse.json(
        { error: "ทรัพยากรไม่เพียงพอ" },
        { status: 400 },
      );
    }

    const { error: insertError } = await supabaseService.from("trades").insert({
      from_city_id: session.city_id,
      to_city_id: toCityId,
      offer_resource_type_id: offerResourceTypeId,
      offer_amount: offerAmount,
      request_resource_type_id: requestResourceTypeId || null,
      request_amount: requestAmount || null,
      note: note || null,
      status: "pending",
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
