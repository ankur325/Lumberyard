export type LogLevel = "error" | "warn" | "info" | "debug" | "none";

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: "#ff6b6b",
  warn: "#f7b955",
  info: "#5b9bff",
  debug: "#9aa4b8",
  none: "#6b7488",
};

export function levelColor(level: LogLevel): string {
  return LEVEL_COLORS[level];
}

/** Heuristic level detection from a log message. */
export function detectLevel(message: string): LogLevel {
  const head = message.slice(0, 200);
  if (/\b(ERROR|FATAL|CRITICAL|Exception|Traceback)\b/i.test(head))
    return "error";
  if (/\b(WARN|WARNING)\b/i.test(head)) return "warn";
  if (/\b(DEBUG|TRACE)\b/i.test(head)) return "debug";
  if (/\b(INFO|NOTICE)\b/i.test(head)) return "info";
  // JSON log line with a level field.
  const m = head.match(/"level"\s*:\s*"(\w+)"/i);
  if (m) {
    const l = m[1].toLowerCase();
    if (l.startsWith("err") || l === "fatal") return "error";
    if (l.startsWith("warn")) return "warn";
    if (l.startsWith("debug") || l === "trace") return "debug";
    if (l === "info") return "info";
  }
  return "none";
}

/** If a message is (or contains) a JSON object, return it pretty-printed. */
export function tryPrettyJson(message: string): string | null {
  const trimmed = message.trim();
  const start = trimmed.indexOf("{");
  if (start === -1) return null;
  const candidate = start === 0 ? trimmed : trimmed.slice(start);
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object") {
      return JSON.stringify(parsed, null, 2);
    }
  } catch {
    // not JSON
  }
  return null;
}

export function formatTimestamp(ts?: number): {
  abs: string;
  time: string;
  date: string;
} {
  if (!ts) return { abs: "—", time: "—", date: "" };
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  return { abs: `${date} ${time}`, time, date };
}
