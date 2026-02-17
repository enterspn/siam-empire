import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseService } from "@/lib/supabase/service";

export async function GET() {
  const session = await getSession();
  if (!session || session.city_id === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [cityRow, assignedRes, allTypesRes, citiesRes] = await Promise.all([
    supabaseService.from("cities").select("negotiation_goal").eq("id", session.city_id).single(),
    supabaseService
      .from("city_assigned_products")
      .select("resource_type_id, resource_types(id, label, icon, key)")
      .eq("city_id", session.city_id),
    supabaseService.from("resource_types").select("id, label, icon, key").eq("is_active", true).order("sort_order"),
    supabaseService
      .from("cities")
      .select("id, name")
      .neq("id", session.city_id)
      .order("name"),
  ]);

  const myProductIds = new Set(
    (assignedRes.data ?? []).map((r) => ((r as { resource_type_id: string }).resource_type_id)),
  );
  type Rt = { id: string; label: string; icon: string | null; key: string };
  const myProducts = (assignedRes.data ?? [])
    .map((r) => {
      const row = r as unknown as { resource_type_id: string; resource_types?: Rt | Rt[] };
      const rt = Array.isArray(row.resource_types) ? row.resource_types[0] : row.resource_types;
      return rt ? { id: rt.id, label: rt.label, icon: rt.icon, key: rt.key } : null;
    })
    .filter((x): x is Rt => x != null);

  const allTypes = (allTypesRes.data ?? []) as { id: string; label: string; icon: string | null; key: string }[];
  const missingProducts = allTypes.filter((t) => !myProductIds.has(t.id));

  const otherCityIds = (citiesRes.data ?? []).map((c) => (c as { id: string }).id);
  const { data: allAssigned } = await supabaseService
    .from("city_assigned_products")
    .select("city_id, resource_type_id, resource_types(id, label, icon, key)")
    .in("city_id", otherCityIds);

  const productsByCity = new Map<string, Rt[]>();
  for (const row of allAssigned ?? []) {
    const r = row as unknown as { city_id: string; resource_types?: Rt | Rt[] };
    const rt = Array.isArray(r.resource_types) ? r.resource_types[0] : r.resource_types;
    if (!rt) continue;
    const list = productsByCity.get(r.city_id) ?? [];
    list.push({ id: rt.id, label: rt.label, icon: rt.icon, key: rt.key });
    productsByCity.set(r.city_id, list);
  }

  const otherCities = (citiesRes.data ?? []).map((c) => {
    const ci = c as { id: string; name: string };
    return {
      id: ci.id,
      name: ci.name,
      products: productsByCity.get(ci.id) ?? [],
    };
  });

  const suggestions: { resource: { id: string; label: string; icon: string | null }; city_id: string; city_name: string }[] = [];
  for (const missing of missingProducts) {
    for (const oc of otherCities) {
      const hasIt = oc.products.some((p) => p.id === missing.id);
      if (hasIt) {
        suggestions.push({
          resource: { id: missing.id, label: missing.label, icon: missing.icon },
          city_id: oc.id,
          city_name: oc.name,
        });
        break;
      }
    }
  }

  return NextResponse.json({
    negotiation_goal: (cityRow.data as { negotiation_goal?: string } | null)?.negotiation_goal ?? "",
    my_products: myProducts,
    missing_products: missingProducts,
    other_cities: otherCities,
    suggestions,
  });
}
