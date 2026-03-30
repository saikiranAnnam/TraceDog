import { NextResponse } from "next/server";

import { resolveApiOrigin } from "@/lib/api";

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } },
) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { detail: "Authorization: Bearer <ADMIN_API_KEY> required" },
      { status: 401 },
    );
  }
  const origin = resolveApiOrigin();
  const jobId = encodeURIComponent(params.jobId);
  const res = await fetch(`${origin}/api/v1/admin/experiments/jobs/${jobId}`, {
    headers: { Authorization: auth },
  });
  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}
