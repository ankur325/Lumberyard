import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertTriangle, ArrowDown, Inbox, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LogEvent } from "../lib/types";
import { Button } from "./ui";
import { LogRow } from "./LogRow";

export function LogViewer({
  events,
  loading,
  error,
  emptyHint,
  live,
  nextToken,
  loadingMore,
  onLoadMore,
}: {
  events: LogEvent[];
  loading: boolean;
  error: string | null;
  emptyHint: string;
  live: boolean;
  nextToken?: string;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [stickToBottom, setStickToBottom] = useState(true);

  const rowKey = useCallback(
    (index: number) => {
      const e = events[index];
      return e.eventId ?? `${e.timestamp}-${index}`;
    },
    [events],
  );

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 20,
    getItemKey: (index) => rowKey(index),
  });

  const toggle = useCallback((index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  // Track whether the user is pinned to the bottom (for live autoscroll).
  const onScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distance < 40);
  }, []);

  // Autoscroll on new live events when pinned to bottom.
  useEffect(() => {
    if (live && stickToBottom && parentRef.current) {
      const el = parentRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [events.length, live, stickToBottom]);

  const scrollToBottom = () => {
    const el = parentRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
  };

  // Initial full-screen states
  if (error) {
    return (
      <Centered>
        <AlertTriangle className="h-8 w-8 text-level-error" />
        <div className="max-w-md text-center text-sm text-fg-muted">{error}</div>
      </Centered>
    );
  }

  if (loading && events.length === 0) {
    return (
      <Centered>
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <div className="text-sm text-fg-subtle">Fetching logs…</div>
      </Centered>
    );
  }

  if (events.length === 0) {
    return (
      <Centered>
        <Inbox className="h-8 w-8 text-fg-subtle" />
        <div className="text-sm text-fg-subtle">{emptyHint}</div>
      </Centered>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={parentRef}
        onScroll={onScroll}
        className="h-full overflow-auto"
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {items.map((item) => (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${item.start}px)`,
              }}
            >
              <LogRow
                event={events[item.index]}
                expanded={expanded.has(item.index)}
                onToggle={() => toggle(item.index)}
              />
            </div>
          ))}
        </div>

        {!live && nextToken && (
          <div className="flex justify-center py-3">
            <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Load more
            </Button>
          </div>
        )}
      </div>

      {live && !stickToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full border border-border-strong bg-bg-panel px-3 py-1.5 text-xs text-fg shadow-lg hover:bg-bg-hover"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Jump to latest
        </button>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      {children}
    </div>
  );
}
