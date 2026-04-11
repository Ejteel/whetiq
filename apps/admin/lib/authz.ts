import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { getRoleByEmail, type AdminRole } from "./controlPlane";

export interface AdminIdentity {
  email: string;
  role: AdminRole;
}

export async function requireAdminIdentity(minRole: AdminRole = "viewer"): Promise<AdminIdentity> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("UNAUTHORIZED");
  }

  const role = await getRoleByEmail(email);
  if (!role) {
    throw new Error("FORBIDDEN");
  }

  const rank: Record<AdminRole, number> = {
    viewer: 1,
    operator: 2,
    super_admin: 3
  };

  if (rank[role] < rank[minRole]) {
    throw new Error("FORBIDDEN");
  }

  return { email, role };
}
