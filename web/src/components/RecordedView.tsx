import { Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { LogEvent, Logger, Recording } from "../lib/types";
import { cn } from "../lib/utils";
import { LogViewer } from "./LogViewer";
import { Button, Select } from "./ui";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordedView({ logger }: { logger: Logger }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [date, setDate] = useState<string>("");
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const list = await api.listRecordings(logger.id);
      setRecordings(list);
      // Keep the current selection if it still exists, else pick the newest.
      setDate((prev) =>
        list.some((r) => r.date === prev) ? prev : (list[0]?.date ?? ""),
      );
    } catch (e: any) {
      setError(e.message ?? "Failed to load recordings");
    }
  }, [logger.id]);

  // (Re)load the file list whenever the active logger changes.
  useEffect(() => {
    setRecordings([]);
    setEvents([]);
    setDate("");
    loadList();
  }, [loadList]);

  // Load events whenever the selected date changes.
  useEffect(() => {
    if (!date) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getRecording(logger.id, date)
      .then((evts) => {
        if (!cancelled) setEvents(evts);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message ?? "Failed to load recording");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logger.id, date]);

  const download = useCallback(() => {
    if (events.length === 0) {
      toast.error("Nothing to download");
      return;
    }
    // Write oldest-first so the file matches chronological order on disk.
    const ndjson = [...events]
      .reverse()
      .map((e) => JSON.stringify(e))
      .join("\n");
    const blob = new Blob([ndjson], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${logger.name}-${date}.ndjson`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events, logger.name, date]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg-subtle px-4 py-2.5">
        {recordings.length > 0 ? (
          <>
            <span className="text-xs text-fg-subtle">Recorded</span>
            <Select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 w-auto min-w-[200px]"
            >
              {recordings.map((r) => (
                <option key={r.date} value={r.date}>
                  {r.date} · {formatBytes(r.bytes)}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={loadList}
              aria-label="Refresh recordings"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={download}
              disabled={events.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <span className="ml-auto text-[11px] text-fg-subtle">
              {events.length.toLocaleString()} events · newest first
            </span>
          </>
        ) : (
          <span className="text-xs text-fg-subtle">
            No recorded logs yet — turn on Live tail to start capturing.
          </span>
        )}
      </div>

      <LogViewer
        events={events}
        loading={loading}
        error={error}
        live={false}
        emptyHint="No recorded events for this day."
      />
    </>
  );
}
