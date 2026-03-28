import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("roles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, designation, department, reports_to } = body;

  if (!name || !designation || !department) {
    return NextResponse.json(
      { error: "Name, designation, and department are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("roles")
    .insert({
      name,
      designation,
      department,
      reports_to: reports_to || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
