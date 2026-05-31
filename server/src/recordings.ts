import { createReadStream } from "node:fs";
import { appendFile, mkdir, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { LogEvent } from "./types.js";

const LOGS_DIR = join(homedir(), ".lumberyard", "logs");

/** A YYYY-MM-DD date string; rejects anything that could escape the directory. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Loggers are UUIDs; be strict so the id can't be used for path traversal. */
const ID_RE = /^[a-zA-Z0-9-]+$/;

function dirFor(loggerId: string): string {
  if (!ID_RE.test(loggerId)) throw new Error(`Invalid logger id: ${loggerId}`);
  return join(LOGS_DIR, loggerId);
}

function fileFor(loggerId: string, date: string): string {
  if (!DATE_RE.test(date)) throw new Error(`Invalid date: ${date}`);
  return join(dirFor(loggerId), `${date}.ndjson`);
}

/** UTC date bucket (YYYY-MM-DD) for an event timestamp. */
function dateOf(timestamp?: number): string {
  return new Date(timestamp ?? Date.now()).toISOString().slice(0, 10);
}

export interface RecordingFile {
  date: string;
  bytes: number;
  modifiedAt: string;
}

/**
 * Append events to per-day NDJSON files under ~/.lumberyard/logs/<loggerId>/.
 * Each event becomes one line; files are bucketed by the event's own UTC date,
 * so a batch that straddles midnight is split correctly.
 */
export async function appendEvents(
  loggerId: string,
  events: LogEvent[],
): Promise<void> {
  if (events.length === 0) return;

  const byDate = new Map<string, string[]>();
  for (const event of events) {
    const date = dateOf(event.timestamp);
    const line = JSON.stringify(event);
    const lines = byDate.get(date);
    if (lines) lines.push(line);
    else byDate.set(date, [line]);
  }

  await mkdir(dirFor(loggerId), { recursive: true });
  for (const [date, lines] of byDate) {
    await appendFile(fileFor(loggerId, date), lines.join("\n") + "\n", "utf8");
  }
}

/** List a logger's recording files, newest day first. */
export async function listRecordings(
  loggerId: string,
): Promise<RecordingFile[]> {
  let names: string[];
  try {
    names = await readdir(dirFor(loggerId));
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }

  const files: RecordingFile[] = [];
  for (const name of names) {
    if (!name.endsWith(".ndjson")) continue;
    const date = name.slice(0, -".ndjson".length);
    if (!DATE_RE.test(date)) continue;
    const info = await stat(join(dirFor(loggerId), name));
    files.push({
      date,
      bytes: info.size,
      modifiedAt: info.mtime.toISOString(),
    });
  }
  files.sort((a, b) => b.date.localeCompare(a.date));
  return files;
}

/**
 * Read one day's recording, newest event first. `limit` caps the number of
 * (most recent) events returned so a huge file doesn't blow up the response.
 */
export async function readRecording(
  loggerId: string,
  date: string,
  limit = 5000,
): Promise<LogEvent[]> {
  const path = fileFor(loggerId, date);
  const events: LogEvent[] = [];
  const stream = createReadStream(path, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of rl) {
      if (!line) continue;
      try {
        events.push(JSON.parse(line) as LogEvent);
      } catch {
        // Skip a corrupt/partial line rather than failing the whole read.
      }
    }
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }

  // File is chronological (append order); reverse for newest-first, then cap.
  events.reverse();
  return events.length > limit ? events.slice(0, limit) : events;
}
