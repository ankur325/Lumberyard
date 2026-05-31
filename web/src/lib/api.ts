import type { LogEvent, LogGroup, Logger, LoggerInput } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getProfiles(): Promise<string[]> {
    const data = await json<{ profiles: string[] }>(
      await fetch("/api/profiles"),
    );
    return data.profiles;
  },

  async getLoggers(): Promise<Logger[]> {
    const data = await json<{ loggers: Logger[] }>(await fetch("/api/loggers"));
    return data.loggers;
  },

  async createLogger(input: LoggerInput): Promise<Logger> {
    const data = await json<{ logger: Logger }>(
      await fetch("/api/loggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    return data.logger;
  },

  async updateLogger(id: string, input: LoggerInput): Promise<Logger> {
    const data = await json<{ logger: Logger }>(
      await fetch(`/api/loggers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    return data.logger;
  },

  async deleteLogger(id: string): Promise<void> {
    const res = await fetch(`/api/loggers/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      throw new Error("Failed to delete logger");
    }
  },

  async getLogGroups(
    profile: string,
    region: string,
    prefix?: string,
  ): Promise<{ logGroups: LogGroup[]; error?: string }> {
    const params = new URLSearchParams({ profile, region });
    if (prefix) params.set("prefix", prefix);
    return json<{ logGroups: LogGroup[]; error?: string }>(
      await fetch(`/api/log-groups?${params.toString()}`),
    );
  },

  async getLogs(opts: {
    loggerId: string;
    start?: number;
    end?: number;
    filterPattern?: string;
    nextToken?: string;
    limit?: number;
  }): Promise<{ events: LogEvent[]; nextToken?: string }> {
    const params = new URLSearchParams({ loggerId: opts.loggerId });
    if (opts.start != null) params.set("start", String(opts.start));
    if (opts.end != null) params.set("end", String(opts.end));
    if (opts.filterPattern) params.set("filterPattern", opts.filterPattern);
    if (opts.nextToken) params.set("nextToken", opts.nextToken);
    if (opts.limit != null) params.set("limit", String(opts.limit));
    return json<{ events: LogEvent[]; nextToken?: string }>(
      await fetch(`/api/logs?${params.toString()}`),
    );
  },

  tailUrl(loggerId: string, filterPattern?: string): string {
    const params = new URLSearchParams({ loggerId });
    if (filterPattern) params.set("filterPattern", filterPattern);
    return `/api/tail?${params.toString()}`;
  },
};

export const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-north-1",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "sa-east-1",
];
