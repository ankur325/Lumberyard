import { useCallback, useRef, useState } from "react";
import { api } from "../lib/api";
import type { LogEvent } from "../lib/types";

export interface LogQuery {
  loggerId: string;
  start?: number;
  end?: number;
  filterPattern?: string;
}

export function useLogs() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const queryRef = useRef<LogQuery | null>(null);

  const run = useCallback(async (query: LogQuery) => {
    queryRef.current = query;
    setLoading(true);
    setError(null);
    setHasRun(true);
    try {
      const res = await api.getLogs({ ...query, limit: 300 });
      setEvents(res.events);
      setNextToken(res.nextToken);
    } catch (e: any) {
      setError(e.message);
      setEvents([]);
      setNextToken(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!queryRef.current || !nextToken) return;
    setLoadingMore(true);
    try {
      const res = await api.getLogs({
        ...queryRef.current,
        nextToken,
        limit: 300,
      });
      setEvents((prev) => [...prev, ...res.events]);
      setNextToken(res.nextToken);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [nextToken]);

  const clear = useCallback(() => {
    setEvents([]);
    setNextToken(undefined);
    setError(null);
    setHasRun(false);
    queryRef.current = null;
  }, []);

  return {
    events,
    nextToken,
    loading,
    loadingMore,
    error,
    hasRun,
    run,
    loadMore,
    clear,
  };
}
