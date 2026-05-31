import { ScrollText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FilterBar } from "./components/FilterBar";
import { LoggerForm } from "./components/LoggerForm";
import { LoggerSidebar } from "./components/LoggerSidebar";
import { LogViewer } from "./components/LogViewer";
import { Badge, Button } from "./components/ui";
import { useLiveTail } from "./hooks/useLiveTail";
import { useLoggers } from "./hooks/useLoggers";
import { useLogs } from "./hooks/useLogs";
import { useProfiles } from "./hooks/useProfiles";
import type { Logger } from "./lib/types";

export default function App() {
  const { loggers, loading, create, update, remove } = useLoggers();
  const profiles = useProfiles();
  const logs = useLogs();
  const tail = useLiveTail();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Logger | undefined>();

  const [presetMs, setPresetMs] = useState(60 * 60 * 1000); // 1h
  const [filterInput, setFilterInput] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [live, setLive] = useState(false);

  const active = loggers.find((l) => l.id === activeId) ?? null;

  // Auto-select first logger once loaded.
  useEffect(() => {
    if (!activeId && loggers.length > 0) setActiveId(loggers[0].id);
  }, [loggers, activeId]);

  // Run a historical query for the active logger.
  const runQuery = useCallback(
    (filter: string) => {
      if (!active) return;
      logs.run({
        loggerId: active.id,
        start: Date.now() - presetMs,
        end: Date.now(),
        filterPattern: filter || undefined,
      });
    },
    [active, presetMs, logs],
  );

  // Re-query when logger / time range changes (historical mode only).
  const lastQueryKey = useRef<string>("");
  useEffect(() => {
    if (!active || live) return;
    const key = `${active.id}:${presetMs}:${appliedFilter}`;
    if (key === lastQueryKey.current) return;
    lastQueryKey.current = key;
    runQuery(appliedFilter);
  }, [active, presetMs, appliedFilter, live, runQuery]);

  // Toggle live tail.
  const handleLiveChange = useCallback(
    (next: boolean) => {
      setLive(next);
      if (!active) return;
      if (next) {
        tail.start(active.id, appliedFilter || undefined);
      } else {
        tail.stop();
        lastQueryKey.current = ""; // force re-query
        runQuery(appliedFilter);
      }
    },
    [active, appliedFilter, tail, runQuery],
  );

  // Restart tail when logger/filter changes while live.
  useEffect(() => {
    if (live && active) {
      tail.start(active.id, appliedFilter || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, appliedFilter]);

  // Surface tail errors.
  useEffect(() => {
    if (tail.status === "error" && tail.error) toast.error(tail.error);
  }, [tail.status, tail.error]);

  function applyFilter() {
    setAppliedFilter(filterInput.trim());
  }

  function selectLogger(logger: Logger) {
    if (logger.id === activeId) return;
    setActiveId(logger.id);
  }

  function openAdd() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(logger: Logger) {
    setEditing(logger);
    setFormOpen(true);
  }

  async function handleDelete(logger: Logger) {
    if (!window.confirm(`Delete logger "${logger.name}"?`)) return;
    try {
      await remove(logger.id);
      if (activeId === logger.id) setActiveId(null);
      toast.success("Logger deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    }
  }

  const displayEvents = live ? tail.events : logs.events;
  const count = displayEvents.length;

  return (
    <div className="flex h-full">
      <LoggerSidebar
        loggers={loggers}
        loading={loading}
        activeId={activeId}
        onSelect={selectLogger}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <header className="flex items-center gap-2 border-b border-border bg-bg-panel px-4 py-2.5">
              <span className="truncate text-sm font-semibold text-fg">
                {active.name}
              </span>
              <span className="truncate text-xs text-fg-subtle">
                {active.logGroup}
              </span>
              <Badge className="ml-auto bg-bg-hover text-fg-muted">
                {active.region}
              </Badge>
              <Badge className="bg-bg-hover text-fg-muted">
                {active.profile}
              </Badge>
            </header>

            <FilterBar
              presetMs={presetMs}
              onPresetChange={setPresetMs}
              filterPattern={filterInput}
              onFilterPatternChange={setFilterInput}
              onSubmitFilter={applyFilter}
              live={live}
              onLiveChange={handleLiveChange}
              onRefresh={() => {
                lastQueryKey.current = "";
                runQuery(appliedFilter);
              }}
              loading={logs.loading}
              tailStatus={tail.status}
              count={count}
            />

            <LogViewer
              events={displayEvents}
              loading={logs.loading}
              error={live ? null : logs.error}
              live={live}
              nextToken={logs.nextToken}
              loadingMore={logs.loadingMore}
              onLoadMore={logs.loadMore}
              emptyHint={
                live
                  ? "Waiting for new log events…"
                  : "No events in this time range. Try a wider range or clearing the filter."
              }
            />
          </>
        ) : (
          <EmptyState onAdd={openAdd} hasLoggers={loggers.length > 0} />
        )}
      </main>

      {formOpen && (
        <LoggerForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          profiles={profiles}
          initial={editing}
          onSubmit={(input) =>
            editing ? update(editing.id, input) : create(input)
          }
        />
      )}
    </div>
  );
}

function EmptyState({
  onAdd,
  hasLoggers,
}: {
  onAdd: () => void;
  hasLoggers: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <ScrollText className="h-12 w-12 text-fg-subtle" />
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-fg">
          {hasLoggers ? "Select a logger" : "No loggers yet"}
        </h2>
        <p className="max-w-sm text-sm text-fg-muted">
          {hasLoggers
            ? "Pick a logger from the sidebar to start viewing logs."
            : "Add a logger (log group + region + profile) to start viewing your AWS CloudWatch logs."}
        </p>
      </div>
      {!hasLoggers && (
        <Button variant="primary" onClick={onAdd}>
          Add your first logger
        </Button>
      )}
    </div>
  );
}
