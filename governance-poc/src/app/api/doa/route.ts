import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("doa_matrix")
    .select("*")
    .order("domain")
    .order("min_threshold", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    domain,
    action_type,
    min_threshold,
    max_threshold,
    approving_role_id,
    cosign_role_id,
    notes,
  } = body;

  if (!domain || !action_type || !approving_role_id) {
    return NextResponse.json(
      { error: "Domain, action_type, and approving_role_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("doa_matrix")
    .insert({
      domain,
      action_type,
      min_threshold: min_threshold || 0,
      max_threshold: max_threshold || null,
      approving_role_id,
      cosign_role_id: cosign_role_id || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
