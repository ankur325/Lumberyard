import { Radio, RefreshCw, Search } from "lucide-react";
import type { TailStatus } from "../hooks/useLiveTail";
import { cn } from "../lib/utils";
import { Button, Input, Switch } from "./ui";

export const TIME_PRESETS = [
  { label: "15m", ms: 15 * 60 * 1000 },
  { label: "1h", ms: 60 * 60 * 1000 },
  { label: "3h", ms: 3 * 60 * 60 * 1000 },
  { label: "12h", ms: 12 * 60 * 60 * 1000 },
  { label: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
] as const;

export function FilterBar({
  presetMs,
  onPresetChange,
  filterPattern,
  onFilterPatternChange,
  onSubmitFilter,
  live,
  onLiveChange,
  onRefresh,
  loading,
  tailStatus,
  count,
}: {
  presetMs: number;
  onPresetChange: (ms: number) => void;
  filterPattern: string;
  onFilterPatternChange: (value: string) => void;
  onSubmitFilter: () => void;
  live: boolean;
  onLiveChange: (live: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
  tailStatus: TailStatus;
  count: number;
}) {
  return (
    <div className="border-b border-border bg-bg-subtle">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        {/* Filter pattern */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={filterPattern}
            placeholder='Filter pattern  e.g.  ERROR   ?WARN   { $.level = "error" }'
            onChange={(e) => onFilterPatternChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitFilter();
            }}
            className="pl-8"
          />
        </div>

        {/* Time range presets (disabled while live) */}
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-md border border-border-strong bg-bg-subtle p-0.5",
            live && "pointer-events-none opacity-40",
          )}
        >
          {TIME_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onPresetChange(p.ms)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                presetMs === p.ms
                  ? "bg-accent text-bg"
                  : "text-fg-muted hover:bg-bg-hover hover:text-fg",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading || live}
          aria-label="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>

        {/* Live tail toggle */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors",
            live
              ? "border-level-error/50 bg-level-error/10"
              : "border-border-strong",
          )}
        >
          <Radio
            className={cn(
              "h-4 w-4",
              live ? "text-level-error" : "text-fg-subtle",
              live && tailStatus === "live" && "animate-pulse",
            )}
          />
          <span className="text-xs font-medium text-fg-muted">Live tail</span>
          <Switch checked={live} onChange={onLiveChange} label="Live tail" />
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-3 px-4 pb-1.5 text-[11px] text-fg-subtle">
        {live ? (
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                tailStatus === "live"
                  ? "bg-level-error animate-pulse"
                  : tailStatus === "connecting"
                    ? "bg-level-warn"
                    : "bg-fg-subtle",
              )}
            />
            {tailStatus === "live"
              ? "Streaming live"
              : tailStatus === "connecting"
                ? "Connecting…"
                : tailStatus === "error"
                  ? "Disconnected"
                  : "Idle"}
            {" · "}
            {count.toLocaleString()} events
          </span>
        ) : (
          <span>{count.toLocaleString()} events</span>
        )}
      </div>
    </div>
  );
}
