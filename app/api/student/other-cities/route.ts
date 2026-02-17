import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.city_id === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("cities")
    .select("id, name")
    .neq("id", session.city_id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cities: data ?? [] });
}
