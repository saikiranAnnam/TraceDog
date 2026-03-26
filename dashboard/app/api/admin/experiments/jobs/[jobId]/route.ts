import { NextResponse } from "next/server";

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

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
  const base = apiBase();
  if (!base) {
    return NextResponse.json({ detail: "NEXT_PUBLIC_API_URL is not set" }, { status: 500 });
  }
  const jobId = encodeURIComponent(params.jobId);
  const res = await fetch(`${base}/api/v1/admin/experiments/jobs/${jobId}`, {
    headers: { Authorization: auth },
  });
  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}
