export interface Logger {
  id: string;
  name: string;
  logGroup: string;
  region: string;
  profile: string;
  /** Cached log group ARN (resolved lazily for live tail). */
  logGroupArn?: string;
  createdAt: string;
}

export type LoggerInput = Omit<Logger, "id" | "createdAt" | "logGroupArn">;

export interface LogEvent {
  eventId?: string;
  timestamp?: number;
  message?: string;
  logStreamName?: string;
}
