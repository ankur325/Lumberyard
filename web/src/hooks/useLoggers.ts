import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Logger, LoggerInput } from "../lib/types";

export function useLoggers() {
  const [loggers, setLoggers] = useState<Logger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoggers(await api.getLoggers());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: LoggerInput) => {
      const logger = await api.createLogger(input);
      await refresh();
      return logger;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: LoggerInput) => {
      const logger = await api.updateLogger(id, input);
      await refresh();
      return logger;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.deleteLogger(id);
      await refresh();
    },
    [refresh],
  );

  return { loggers, loading, error, refresh, create, update, remove };
}
