import { NextRequest, NextResponse } from "next/server";
import { requireAdminIdentity } from "../../../../lib/authz";
import { listAdminUsers, upsertAdminUser, type AdminRole } from "../../../../lib/controlPlane";

function parseRole(value: string | undefined): AdminRole | null {
  if (value === "viewer" || value === "operator" || value === "super_admin") {
    return value;
  }
  return null;
}

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdminIdentity("viewer");
    return NextResponse.json({ users: await listAdminUsers() });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = await requireAdminIdentity("super_admin");
    const body = (await request.json()) as { email?: string; role?: string };

    const email = body.email?.trim().toLowerCase();
    const role = parseRole(body.role);

    if (!email || !role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    }

    await upsertAdminUser(email, role, identity.email);
    return NextResponse.json({ ok: true, users: await listAdminUsers() });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}
