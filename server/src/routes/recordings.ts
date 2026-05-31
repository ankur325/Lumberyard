import { Router } from "express";
import { listRecordings, readRecording } from "../recordings.js";
import { getLogger } from "../store.js";

const router = Router();

/** List the saved recording files for a logger (newest day first). */
router.get("/recordings", async (req, res) => {
  const loggerId = String(req.query.loggerId ?? "");
  const logger = await getLogger(loggerId);
  if (!logger) return res.status(404).json({ error: "Logger not found" });

  try {
    const recordings = await listRecordings(loggerId);
    res.json({ recordings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to list recordings" });
  }
});

/** Read one day's recorded events, newest first. */
router.get("/recordings/events", async (req, res) => {
  const loggerId = String(req.query.loggerId ?? "");
  const date = String(req.query.date ?? "");
  const logger = await getLogger(loggerId);
  if (!logger) return res.status(404).json({ error: "Logger not found" });

  const limit = req.query.limit
    ? Math.min(Number(req.query.limit), 20000)
    : 5000;

  try {
    const events = await readRecording(loggerId, date, limit);
    res.json({ events });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Failed to read recording" });
  }
});

export default router;
