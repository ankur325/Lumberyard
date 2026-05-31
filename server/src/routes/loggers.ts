import { Router } from "express";
import {
  createLogger,
  deleteLogger,
  listLoggers,
  updateLogger,
} from "../store.js";
import type { LoggerInput } from "../types.js";

const router = Router();

function validate(body: any): { ok: true; value: LoggerInput } | { ok: false; error: string } {
  const fields = ["name", "logGroup", "region", "profile"] as const;
  for (const f of fields) {
    if (typeof body?.[f] !== "string" || body[f].trim() === "") {
      return { ok: false, error: `Missing or invalid field: ${f}` };
    }
  }
  return {
    ok: true,
    value: {
      name: body.name.trim(),
      logGroup: body.logGroup.trim(),
      region: body.region.trim(),
      profile: body.profile.trim(),
    },
  };
}

router.get("/loggers", async (_req, res) => {
  res.json({ loggers: await listLoggers() });
});

router.post("/loggers", async (req, res) => {
  const result = validate(req.body);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.status(201).json({ logger: await createLogger(result.value) });
});

router.put("/loggers/:id", async (req, res) => {
  const result = validate(req.body);
  if (!result.ok) return res.status(400).json({ error: result.error });
  const updated = await updateLogger(req.params.id, result.value);
  if (!updated) return res.status(404).json({ error: "Logger not found" });
  res.json({ logger: updated });
});

router.delete("/loggers/:id", async (req, res) => {
  const ok = await deleteLogger(req.params.id);
  if (!ok) return res.status(404).json({ error: "Logger not found" });
  res.status(204).end();
});

export default router;
