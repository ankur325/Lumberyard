import {
  DescribeLogGroupsCommand,
  paginateDescribeLogGroups,
} from "@aws-sdk/client-cloudwatch-logs";
import { Router } from "express";
import { awsError, getClient } from "../aws.js";

const router = Router();

/** Lists log groups for a profile/region, optionally filtered by a substring. */
router.get("/log-groups", async (req, res) => {
  const profile = String(req.query.profile ?? "default");
  const region = String(req.query.region ?? "us-east-1");
  // Substring match anywhere in the name (CloudWatch's logGroupNamePattern),
  // not just a prefix, so typing "welcome" matches "/aws/apigateway/welcome".
  // The SDK rejects patterns containing "*" or ":", so strip wildcard chars
  // the user may type out of habit.
  const raw = req.query.prefix ? String(req.query.prefix) : "";
  const pattern = raw.replace(/[*:]/g, "") || undefined;

  try {
    const client = getClient(profile, region);
    const groups: Array<{ name: string; arn?: string }> = [];
    const paginator = paginateDescribeLogGroups(
      { client, pageSize: 50 },
      { logGroupNamePattern: pattern },
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
