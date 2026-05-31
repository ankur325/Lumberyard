import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { DATA_FILE_PATH } from "./store.js";
import discoveryRouter from "./routes/discovery.js";
import loggersRouter from "./routes/loggers.js";
import logsRouter from "./routes/logs.js";
import profilesRouter from "./routes/profiles.js";
import recordingsRouter from "./routes/recordings.js";
import tailRouter from "./routes/tail.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4517);

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, dataFile: DATA_FILE_PATH });
});

app.use("/api", profilesRouter);
app.use("/api", discoveryRouter);
app.use("/api", loggersRouter);
app.use("/api", logsRouter);
app.use("/api", tailRouter);
app.use("/api", recordingsRouter);

// In production, serve the built frontend.
const webDist = join(__dirname, "..", "..", "web", "dist");
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (_req, res) => {
    res.sendFile(join(webDist, "index.html"));
  });
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Lumberyard server listening on http://127.0.0.1:${PORT}`);
  console.log(`loggers stored at ${DATA_FILE_PATH}`);
});
