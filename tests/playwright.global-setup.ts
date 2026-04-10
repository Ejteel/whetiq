import { encode } from "next-auth/jwt";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDefaultE2EState } from "../packages/core/src/e2e-state";

const ownerStorageStatePath = resolve(
  process.cwd(),
  ".tmp/owner-storage-state.json",
);
const e2eStatePath = resolve(process.cwd(), ".tmp/whetiq-e2e-state.json");

export default async function globalSetup(): Promise<void> {
  await mkdir(resolve(process.cwd(), ".tmp"), { recursive: true });
  await writeFile(
    e2eStatePath,
    JSON.stringify(createDefaultE2EState(), null, 2),
    "utf8",
  );

  const sessionToken = await encode({
    secret: "test-auth-secret",
    token: {
      email: "owner@example.com",
      name: "Owner",
    },
  });

  await writeFile(
    ownerStorageStatePath,
    JSON.stringify(
      {
        cookies: [
          {
            domain: "127.0.0.1",
            expires: -1,
            httpOnly: true,
            name: "next-auth.session-token",
            path: "/",
            sameSite: "Lax",
            secure: false,
            value: sessionToken,
          },
        ],
        origins: [],
      },
      null,
      2,
    ),
    "utf8",
  );
}
