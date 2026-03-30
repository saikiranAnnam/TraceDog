import { NextResponse } from "next/server";

import { resolveApiOrigin } from "@/lib/api";

export async function GET() {
  const origin = resolveApiOrigin();
  const res = await fetch(`${origin}/api/v1/admin/experiments/repair-llm-live`, {
    cache: "no-store",
  });
  const out = await res.json().catch(() => ({}));
  return NextResponse.json(out, { status: res.status });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { detail: "Authorization: Bearer <ADMIN_API_KEY> required" },
      { status: 401 },
    );
  }
  const origin = resolveApiOrigin();
  let body: unknown = { model: "gpt-4o-mini" };
  try {
    body = await req.json();
  } catch {
    /* use default */
  }
  const res = await fetch(`${origin}/api/v1/admin/experiments/repair-llm-live/run`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  return NextResponse.json(out, { status: res.status });
}
