import { FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { Router } from "express";
import { awsError, getClient } from "../aws.js";
import { getLogger } from "../store.js";
import type { LogEvent } from "../types.js";

const router = Router();

/** Historical query: FilterLogEvents with time range + filter pattern + paging. */
router.get("/logs", async (req, res) => {
  const loggerId = String(req.query.loggerId ?? "");
  const logger = await getLogger(loggerId);
  if (!logger) return res.status(404).json({ error: "Logger not found" });

  const start = req.query.start ? Number(req.query.start) : undefined;
  const end = req.query.end ? Number(req.query.end) : undefined;
  const filterPattern = req.query.filterPattern
    ? String(req.query.filterPattern)
    : undefined;
  const nextToken = req.query.nextToken ? String(req.query.nextToken) : undefined;
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 1000) : 200;

  try {
    const client = getClient(logger.profile, logger.region);
    const out = await client.send(
      new FilterLogEventsCommand({
        logGroupName: logger.logGroup,
        startTime: start,
        endTime: end,
        filterPattern: filterPattern || undefined,
        nextToken,
        limit,
      }),
    );
    const events: LogEvent[] = (out.events ?? []).map((e) => ({
      eventId: e.eventId,
      timestamp: e.timestamp,
      message: e.message,
      logStreamName: e.logStreamName,
    }));
    res.json({ events, nextToken: out.nextToken });
  } catch (err) {
    const { status, message } = awsError(err);
    res.status(status).json({ error: message });
  }
});

export default router;
