import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [decisionResult, logsResult] = await Promise.all([
    supabaseAdmin.from("decision_requests").select("*").eq("id", id).single(),
    supabaseAdmin
      .from("approval_logs")
      .select("*")
      .eq("decision_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (decisionResult.error) {
    return NextResponse.json(
      { error: "Decision not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    decision: decisionResult.data,
    logs: logsResult.data || [],
  });
}
