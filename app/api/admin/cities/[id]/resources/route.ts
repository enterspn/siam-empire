import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: cityId } = await params;

  try {
    const body = await req.json();
    const resources = body.resources as Record<string, number> | undefined;
    if (!resources || typeof resources !== "object") {
      return NextResponse.json(
        { error: "กรุณาส่ง resources เป็น object เช่น { resource_type_id: จำนวน }" },
        { status: 400 },
      );
    }

    for (const [resourceTypeId, amount] of Object.entries(resources)) {
      const num = Math.max(0, Math.floor(Number(amount)) || 0);

      const { data: existing } = await supabaseService
        .from("city_resources")
        .select("id, amount")
        .eq("city_id", cityId)
        .eq("resource_type_id", resourceTypeId)
        .single();

      if (existing) {
        await supabaseService
          .from("city_resources")
          .update({ amount: num })
          .eq("id", existing.id);
      } else {
        await supabaseService.from("city_resources").insert({
          city_id: cityId,
          resource_type_id: resourceTypeId,
          amount: num,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
