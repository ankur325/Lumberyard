import {
  DescribeLogGroupsCommand,
  StartLiveTailCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { Router } from "express";
import { awsError, getClient } from "../aws.js";
import { getLogger, updateLogger } from "../store.js";

const router = Router();

/** Resolves (and caches) the ARN for a logger's log group. */
async function resolveArn(logger: {
  id: string;
  logGroup: string;
  profile: string;
  region: string;
  logGroupArn?: string;
}): Promise<string> {
  if (logger.logGroupArn) return logger.logGroupArn;
  const client = getClient(logger.profile, logger.region);
  const out = await client.send(
    new DescribeLogGroupsCommand({ logGroupNamePrefix: logger.logGroup }),
  );
  const match = (out.logGroups ?? []).find(
    (g) => g.logGroupName === logger.logGroup,
  );
  if (!match?.arn) {
    throw Object.assign(new Error(`Log group not found: ${logger.logGroup}`), {
      name: "ResourceNotFoundException",
    });
  }
  // StartLiveTail rejects the trailing ":*" some ARNs carry.
  const arn = match.arn.replace(/:\*$/, "");
  await updateLogger(logger.id, { logGroupArn: arn });
  return arn;
}

/** Live tail via StartLiveTail, streamed to the browser over SSE. */
router.get("/tail", async (req, res) => {
  const loggerId = String(req.query.loggerId ?? "");
  const logger = await getLogger(loggerId);
  if (!logger) return res.status(404).json({ error: "Logger not found" });

  const filterPattern = req.query.filterPattern
    ? String(req.query.filterPattern)
    : undefined;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let closed = false;
  const heartbeat = setInterval(() => {
    if (!closed) res.write(": ping\n\n");
  }, 15000);
  req.on("close", () => {
    closed = true;
    clearInterval(heartbeat);
  });

  try {
    const arn = await resolveArn(logger);
    const client = getClient(logger.profile, logger.region);
    const command = new StartLiveTailCommand({
      logGroupIdentifiers: [arn],
      logEventFilterPattern: filterPattern || undefined,
    });
    const response = await client.send(command);
    send("open", { logGroup: logger.logGroup });

    for await (const event of response.responseStream ?? []) {
      if (closed) break;
      if (event.sessionStart) {
        send("session", { state: "started" });
      } else if (event.sessionUpdate) {
        for (const result of event.sessionUpdate.sessionResults ?? []) {
          send("log", {
            timestamp: result.timestamp,
            message: result.message,
            logStreamName: result.logStreamName,
          });
        }
      }
    }
    if (!closed) send("end", { reason: "stream-closed" });
  } catch (err) {
    const { message } = awsError(err);
    if (!closed) send("error", { message });
  } finally {
    clearInterval(heartbeat);
    if (!closed) res.end();
  }
});

export default router;
