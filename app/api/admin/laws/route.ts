import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("laws")
    .select("id, title, description, bonus_type, bonus_value, status, created_at, city:cities!laws_city_id_fkey(name)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []).sort((a, b) => {
    const order = { pending: 0, approved: 1, rejected: 2 };
    return (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1);
  });

  return NextResponse.json({ laws: list });
}
