import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inventoryCsvHeaders, toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const template = new URL(request.url).searchParams.get("template") === "1";
  let rows: unknown[][] = [];
  if (template) {
    rows = [["Paracetamol 500mg", "Paracetamol", "Emzor", "pain-fever", "Tablet", "500mg", "96 tablets", "1200", "100", "20", "no", "yes", "A4-0233", "For pain and fever", "1–2 tablets every 6 hours", ""]];
  } else {
    const { data, error } = await supabase
      .from("drugs")
      .select("*, category:categories(slug)")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []).map((d) => [
      d.name, d.generic_name, d.brand, d.category?.slug, d.dosage_form, d.strength, d.pack_size,
      d.price, d.stock_qty, d.low_stock_threshold, d.requires_prescription ? "yes" : "no", d.is_active ? "yes" : "no",
      d.nafdac_no, d.description, d.usage_notes, d.slug,
    ]);
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(inventoryCsvHeaders, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template ? "inventory-template" : `inventory-${date}`}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
