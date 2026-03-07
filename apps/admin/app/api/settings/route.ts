import { NextRequest, NextResponse } from "next/server";
import { getRuntimeMode } from "../../../lib/controlPlane";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const serviceToken = process.env.CONTROL_PLANE_SERVICE_TOKEN;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";

  if (!serviceToken || token !== serviceToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = request.nextUrl.searchParams.get("appId") ?? "aggregator-web";
  return NextResponse.json({ appId, mode: getRuntimeMode(appId) });
}
