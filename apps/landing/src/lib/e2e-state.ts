import type { E2EState, LandingProfile } from "@mvp/core";
import { createDefaultE2EState } from "@mvp/core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_E2E_STATE_PATH = resolve(
  process.cwd(),
  ".tmp/whetiq-e2e-state.json",
);

function getStatePath(): string {
  return process.env.WHETIQ_E2E_STATE_PATH ?? DEFAULT_E2E_STATE_PATH;
}

function ensureStateFile(): void {
  const statePath = getStatePath();
  if (existsSync(statePath)) {
    return;
  }

  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(
    statePath,
    JSON.stringify(createDefaultE2EState(), null, 2),
    "utf8",
  );
}

export function readLandingE2EState(): E2EState {
  ensureStateFile();
  return JSON.parse(readFileSync(getStatePath(), "utf8")) as E2EState;
}

export function writeLandingE2EState(state: E2EState): void {
  ensureStateFile();
  writeFileSync(getStatePath(), JSON.stringify(state, null, 2), "utf8");
}

export function cloneLandingProfile(profile: LandingProfile): LandingProfile {
  return structuredClone(profile);
}
