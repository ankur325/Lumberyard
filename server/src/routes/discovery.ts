import {
  DescribeLogGroupsCommand,
  paginateDescribeLogGroups,
} from "@aws-sdk/client-cloudwatch-logs";
import { Router } from "express";
import { awsError, getClient } from "../aws.js";

const router = Router();

/** Lists log groups for a profile/region, optionally filtered by name prefix. */
router.get("/log-groups", async (req, res) => {
  const profile = String(req.query.profile ?? "default");
  const region = String(req.query.region ?? "us-east-1");
  const prefix = req.query.prefix ? String(req.query.prefix) : undefined;

  try {
    const client = getClient(profile, region);
    const groups: Array<{ name: string; arn?: string }> = [];
    const paginator = paginateDescribeLogGroups(
      { client, pageSize: 50 },
      { logGroupNamePrefix: prefix },
    );
    for await (const page of paginator) {
      for (const g of page.logGroups ?? []) {
        if (g.logGroupName) groups.push({ name: g.logGroupName, arn: g.arn });
      }
      // Cap to keep the autocomplete responsive.
      if (groups.length >= 200) break;
    }
    res.json({ logGroups: groups });
  } catch (err) {
    const { status, message } = awsError(err);
    // Autocomplete should degrade gracefully — return empty list with a note.
    res.status(status === 403 ? 200 : status).json({
      logGroups: [],
      error: message,
    });
  }
});

export default router;
