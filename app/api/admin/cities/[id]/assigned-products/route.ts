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
    const ids = body.resource_type_ids as string[] | undefined;
    if (!Array.isArray(ids) || ids.length !== 2) {
      return NextResponse.json(
        { error: "กรุณาเลือกสินค้า (resource_type_ids) จำนวน 2 อย่าง" },
        { status: 400 },
      );
    }

    const [id1, id2] = ids;
    if (!id1 || !id2 || id1 === id2) {
      return NextResponse.json(
        { error: "ต้องเลือกสินค้าคนละชนิด 2 อย่าง" },
        { status: 400 },
      );
    }

    await supabaseService.from("city_assigned_products").delete().eq("city_id", cityId);

    await supabaseService.from("city_assigned_products").insert([
      { city_id: cityId, resource_type_id: id1 },
      { city_id: cityId, resource_type_id: id2 },
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
