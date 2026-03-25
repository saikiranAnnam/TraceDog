import { NextResponse } from "next/server";

/**
 * Lightweight noop for dev tooling (e.g. IDE / extensions) that poll
 * /api/benchmark on the Next dev server. Not related to TraceDog or LLM API keys.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, service: "tracedog-dashboard" });
}
