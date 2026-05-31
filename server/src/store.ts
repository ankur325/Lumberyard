import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Logger, LoggerInput } from "./types.js";

const DATA_DIR = join(homedir(), ".lumberyard");
const DATA_FILE = join(DATA_DIR, "loggers.json");

async function readAll(): Promise<Logger[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Logger[]) : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

/** Atomic write: write to a temp file then rename over the target. */
async function writeAll(loggers: Logger[]): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(loggers, null, 2), "utf8");
  await rename(tmp, DATA_FILE);
}

export async function listLoggers(): Promise<Logger[]> {
  return readAll();
}

export async function getLogger(id: string): Promise<Logger | undefined> {
  return (await readAll()).find((l) => l.id === id);
}

export async function createLogger(input: LoggerInput): Promise<Logger> {
  const loggers = await readAll();
  const logger: Logger = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  loggers.push(logger);
  await writeAll(loggers);
  return logger;
}

export async function updateLogger(
  id: string,
  patch: Partial<LoggerInput> & { logGroupArn?: string },
): Promise<Logger | undefined> {
  const loggers = await readAll();
  const idx = loggers.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  // If addressing changes, drop the cached ARN so it gets re-resolved.
  const addressingChanged =
    (patch.logGroup && patch.logGroup !== loggers[idx].logGroup) ||
    (patch.region && patch.region !== loggers[idx].region) ||
    (patch.profile && patch.profile !== loggers[idx].profile);
  loggers[idx] = {
    ...loggers[idx],
    ...patch,
    ...(addressingChanged && patch.logGroupArn === undefined
      ? { logGroupArn: undefined }
      : {}),
  };
  await writeAll(loggers);
  return loggers[idx];
}

export async function deleteLogger(id: string): Promise<boolean> {
  const loggers = await readAll();
  const next = loggers.filter((l) => l.id !== id);
  if (next.length === loggers.length) return false;
  await writeAll(next);
  return true;
}

export const DATA_FILE_PATH = DATA_FILE;
