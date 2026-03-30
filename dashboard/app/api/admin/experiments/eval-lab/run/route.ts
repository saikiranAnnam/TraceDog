import { NextResponse } from "next/server";

import { resolveApiOrigin } from "@/lib/api";

export async function GET() {
  const origin = resolveApiOrigin();
  const res = await fetch(`${origin}/api/v1/admin/experiments/eval-lab`, {
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
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }
  const res = await fetch(`${origin}/api/v1/admin/experiments/eval-lab/run`, {
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
