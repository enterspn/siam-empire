import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("trades")
    .select(
      "id, offer_amount, request_amount, status, note, created_at, from_city:cities!trades_from_city_id_fkey(name), to_city:cities!trades_to_city_id_fkey(name), offer_rt:resource_types!trades_offer_resource_type_id_fkey(label, icon), request_rt:resource_types!trades_request_resource_type_id_fkey(label, icon)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trades: data ?? [] });
}
