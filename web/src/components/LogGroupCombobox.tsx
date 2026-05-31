import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { LogGroup } from "../lib/types";
import { cn } from "../lib/utils";
import { Input } from "./ui";

export function LogGroupCombobox({
  profile,
  region,
  value,
  onChange,
}: {
  profile: string;
  region: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<LogGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch as the user types / changes profile|region.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      try {
        const res = await api.getLogGroups(profile, region, value || undefined);
        if (cancelled) return;
        setGroups(res.logGroups);
        setError(res.error ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, profile, region, value]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          placeholder="/aws/lambda/my-function"
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pr-8"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border-strong bg-bg-panel py-1 shadow-xl">
          {error && (
            <div className="px-3 py-2 text-xs text-level-warn">
              {error.includes("denied") || error.includes("Denied")
                ? "No permission to list log groups — type the name manually."
                : error}
            </div>
          )}
          {!error && groups.length === 0 && !loading && (
            <div className="px-3 py-2 text-xs text-fg-subtle">
              No log groups found. Type the full name manually.
            </div>
          )}
          {groups.map((g) => (
            <button
              key={g.name}
              type="button"
              onClick={() => {
                onChange(g.name);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-bg-hover",
                g.name === value ? "text-accent" : "text-fg",
              )}
            >
              <span className="truncate">{g.name}</span>
              {g.name === value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
