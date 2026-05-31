import { Pencil, Plus, ScrollText, Trash2 } from "lucide-react";
import type { Logger } from "../lib/types";
import { cn } from "../lib/utils";
import { Badge, Button } from "./ui";

export function LoggerSidebar({
  loggers,
  loading,
  activeId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: {
  loggers: Logger[];
  loading: boolean;
  activeId: string | null;
  onSelect: (logger: Logger) => void;
  onAdd: () => void;
  onEdit: (logger: Logger) => void;
  onDelete: (logger: Logger) => void;
}) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-bg-subtle">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <ScrollText className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-fg">
          Lumberyard
        </span>
      </div>

      <div className="px-3 pb-2">
        <Button variant="outline" className="w-full" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add logger
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading && (
          <div className="px-2 py-6 text-center text-xs text-fg-subtle">
            Loading…
          </div>
        )}
        {!loading && loggers.length === 0 && (
          <div className="px-3 py-8 text-center text-xs leading-relaxed text-fg-subtle">
            No loggers yet.
            <br />
            Add one to start viewing logs.
          </div>
        )}
        <ul className="space-y-0.5">
          {loggers.map((logger) => (
            <li key={logger.id}>
              <div
                onClick={() => onSelect(logger)}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 transition-colors",
                  logger.id === activeId
                    ? "bg-accent/15 ring-1 ring-inset ring-accent/30"
                    : "hover:bg-bg-hover",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate text-sm font-medium",
                      logger.id === activeId ? "text-fg" : "text-fg",
                    )}
                  >
                    {logger.name}
                  </div>
                  <div className="truncate text-[11px] text-fg-subtle">
                    {logger.logGroup}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <Badge className="bg-bg-hover text-fg-muted">
                      {logger.region}
                    </Badge>
                    <Badge className="bg-bg-hover text-fg-muted">
                      {logger.profile}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(logger);
                    }}
                    className="rounded p-1 text-fg-subtle hover:bg-bg-panel hover:text-fg"
                    aria-label="Edit logger"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(logger);
                    }}
                    className="rounded p-1 text-fg-subtle hover:bg-level-error/10 hover:text-level-error"
                    aria-label="Delete logger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border px-4 py-2.5 text-[10px] text-fg-subtle">
        Reads ~/.aws profiles · localhost only
      </div>
    </aside>
  );
}
