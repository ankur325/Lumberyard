import { Check, ChevronRight, Copy } from "lucide-react";
import { memo, useState } from "react";
import type { LogEvent } from "../lib/types";
import {
  detectLevel,
  formatTimestamp,
  levelColor,
  tryPrettyJson,
} from "../lib/log-format";
import { cn } from "../lib/utils";

export const LogRow = memo(function LogRow({
  event,
  expanded,
  onToggle,
}: {
  event: LogEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const message = event.message ?? "";
  const level = detectLevel(message);
  const color = levelColor(level);
  const { abs, time } = formatTimestamp(event.timestamp);
  const pretty = expanded ? tryPrettyJson(message) : null;

  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div
      onClick={onToggle}
      className={cn(
        "group cursor-pointer border-l-2 px-3 py-1 text-xs leading-relaxed transition-colors hover:bg-bg-hover",
      )}
      style={{ borderLeftColor: level === "none" ? "transparent" : color }}
    >
      <div className="flex items-start gap-2">
        <ChevronRight
          className={cn(
            "mt-0.5 h-3 w-3 shrink-0 text-fg-subtle transition-transform",
            expanded && "rotate-90",
          )}
        />
        <span
          className="mt-px shrink-0 font-medium tabular-nums text-fg-subtle"
          title={abs}
        >
          {time}
        </span>
        {level !== "none" && (
          <span
            className="mt-px shrink-0 text-[10px] font-bold uppercase tracking-wide"
            style={{ color }}
          >
            {level}
          </span>
        )}
        <span
          className={cn(
            "min-w-0 flex-1 whitespace-pre-wrap break-words text-fg",
            !expanded && "truncate",
          )}
        >
          {expanded ? message : message.replace(/\s+/g, " ").trim()}
        </span>
        <button
          onClick={copy}
          className="shrink-0 rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-bg-panel hover:text-fg group-hover:opacity-100"
          aria-label="Copy message"
        >
          {copied ? (
            <Check className="h-3 w-3 text-level-info" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="ml-7 mt-1.5 space-y-2 pb-1">
          {pretty && (
            <pre className="overflow-x-auto rounded-md border border-border bg-bg p-2.5 text-[11px] leading-relaxed text-fg">
              {pretty}
            </pre>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-fg-subtle">
            <span>{abs}</span>
            {event.logStreamName && (
              <span className="truncate">stream: {event.logStreamName}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
