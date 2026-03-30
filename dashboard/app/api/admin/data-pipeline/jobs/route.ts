import { NextResponse } from "next/server";

import { resolveApiOrigin } from "@/lib/api";

/** Optional discovery / health: enqueue is POST only (proxies to the API). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    methods: ["POST"],
    path: "/api/admin/data-pipeline/jobs",
    body: { script: "pytest | pytest_offline | pytest_full | smoke_squad" },
  });
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
    return NextResponse.json({ detail: "Invalid JSON body; expected { script }" }, { status: 400 });
  }
  const res = await fetch(`${origin}/api/v1/admin/data-pipeline/jobs`, {
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
