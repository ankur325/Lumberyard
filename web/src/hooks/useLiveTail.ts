import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { LogEvent } from "../lib/types";

const MAX_BUFFERED = 5000;

export type TailStatus = "idle" | "connecting" | "live" | "error";

export function useLiveTail() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [status, setStatus] = useState<TailStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(
    (loggerId: string, filterPattern?: string) => {
      sourceRef.current?.close();
      setEvents([]);
      setError(null);
      setStatus("connecting");

      const source = new EventSource(api.tailUrl(loggerId, filterPattern));
      sourceRef.current = source;

      source.addEventListener("open", () => setStatus("live"));
      source.addEventListener("session", () => setStatus("live"));
      source.addEventListener("log", (e) => {
        const data = JSON.parse((e as MessageEvent).data) as LogEvent;
        setEvents((prev) => {
          const next = [...prev, data];
          return next.length > MAX_BUFFERED
            ? next.slice(next.length - MAX_BUFFERED)
            : next;
        });
      });
      source.addEventListener("error", (e) => {
        const msg = (e as MessageEvent).data;
        if (msg) {
          try {
            setError(JSON.parse(msg).message);
          } catch {
            setError("Live tail connection error");
          }
        }
        setStatus("error");
        source.close();
      });
    },
    [],
  );

  const clear = useCallback(() => setEvents([]), []);

  useEffect(() => () => sourceRef.current?.close(), []);

  return { events, status, error, start, stop, clear };
}
