export interface Logger {
  id: string;
  name: string;
  logGroup: string;
  region: string;
  profile: string;
  logGroupArn?: string;
  createdAt: string;
}

export type LoggerInput = Pick<
  Logger,
  "name" | "logGroup" | "region" | "profile"
>;

export interface LogEvent {
  eventId?: string;
  timestamp?: number;
  message?: string;
  logStreamName?: string;
}

export interface LogGroup {
  name: string;
  arn?: string;
}

export interface Recording {
  date: string;
  bytes: number;
  modifiedAt: string;
}
