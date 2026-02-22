import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const resources: Record<string, number> = body.resources ?? {};
    const uniqueAsset: string = body.uniqueAsset ?? "";

    for (const [resourceTypeId, amount] of Object.entries(resources)) {
      await supabaseService.from("city_resources").upsert(
        { city_id: id, resource_type_id: resourceTypeId, amount: Math.max(0, Math.floor(Number(amount) || 0)) },
        { onConflict: "city_id,resource_type_id" },
      );
    }

    const { error } = await supabaseService
      .from("cities")
      .update({ unique_asset: uniqueAsset, resources_released: true })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
