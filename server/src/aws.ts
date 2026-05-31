import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { fromIni } from "@aws-sdk/credential-providers";

const clients = new Map<string, CloudWatchLogsClient>();

/** Returns a memoized CloudWatch Logs client for a given profile + region. */
export function getClient(profile: string, region: string): CloudWatchLogsClient {
  const key = `${profile}:${region}`;
  let client = clients.get(key);
  if (!client) {
    client = new CloudWatchLogsClient({
      region,
      credentials: fromIni({ profile }),
    });
    clients.set(key, client);
  }
  return client;
}

/** Normalizes an AWS SDK error into a friendly message + status code. */
export function awsError(err: any): { status: number; message: string } {
  const name = err?.name ?? "Error";
  const message = err?.message ?? String(err);
  if (name === "AccessDeniedException" || name === "AccessDenied") {
    return { status: 403, message };
  }
  if (name === "ResourceNotFoundException") {
    return { status: 404, message };
  }
  if (
    name === "CredentialsProviderError" ||
    name === "ProfileNotFoundError" ||
    /profile/i.test(message)
  ) {
    return { status: 400, message };
  }
  return { status: 502, message };
}
