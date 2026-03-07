import { NextRequest, NextResponse } from "next/server";
import { requireAdminIdentity } from "../../../../lib/authz";
import { getRuntimeMode, setRuntimeMode, type RuntimeMode } from "../../../../lib/controlPlane";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireAdminIdentity("viewer");
    const appId = request.nextUrl.searchParams.get("appId") ?? "aggregator-web";
    return NextResponse.json({ appId, mode: getRuntimeMode(appId), role: identity.role });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireAdminIdentity("operator");
    const body = (await request.json()) as { appId?: string; mode?: RuntimeMode };

    if (body.mode !== "demo" && body.mode !== "private_live") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const appId = body.appId?.trim() || "aggregator-web";
    setRuntimeMode(appId, body.mode, identity.email);

    return NextResponse.json({ ok: true, appId, mode: body.mode });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}
