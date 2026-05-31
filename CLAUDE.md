# CLAUDE.md

Guidance for AI coding assistants (and humans) working in this repo.

## What this is

**Lumberyard** is a local web app for viewing AWS CloudWatch Logs. It's an npm
workspaces monorepo with two packages:

- `server/` — Node + Express + TypeScript backend. Owns AWS access and persistence.
- `web/` — React + Vite + TypeScript + Tailwind frontend. The UI.

The split exists because a browser cannot read `~/.aws` credentials or call AWS with
a named profile. The backend holds all AWS logic; the frontend talks to it over
`/api/*`. The frontend only ever receives profile *names*, never secrets.

## Run / build / check

```bash
npm install            # root install covers both workspaces
npm run dev            # concurrently: server (:4517) + web (:5173)
npm run dev:server     # backend only (tsx watch)
npm run dev:web        # frontend only (vite)
npm run build          # web build + server tsc — also serves as the typecheck gate
npm start              # prod: server serves web/dist on :4517
```

There is no test suite yet. **The build is the gate** — both workspaces are
`strict` TypeScript. Run `npm run build` before considering a change done. For a
faster check: `npx tsc -p server/tsconfig.json --noEmit` and `cd web && npx tsc --noEmit`.

To verify behavior, run the app and exercise it against a real AWS profile (the SDK
reads `~/.aws`). `curl` the API directly for quick backend checks, e.g.
`curl 'http://127.0.0.1:4517/api/log-groups?profile=default&region=us-east-1'`.

## Architecture & data flow

- **Persistence** (`server/src/store.ts`): loggers are stored as a JSON array at
  `~/.lumberyard/loggers.json`. Writes are atomic (temp file + `rename`). The file is
  tiny, so it's read fresh on each request — no in-memory cache to invalidate.
- **Recordings** (`server/src/recordings.ts`): live-tailed events are appended to
  per-day NDJSON files at `~/.lumberyard/logs/<loggerId>/<YYYY-MM-DD>.ndjson` (one
  event per line, bucketed by the event's own UTC date). This is the durable look-back
  store — anything that streamed survives a logger switch or browser refresh. Reads
  return newest-first (file is chronological, then reversed) and are capped by `limit`.
- **AWS client** (`server/src/aws.ts`): `getClient(profile, region)` returns a
  memoized `CloudWatchLogsClient` using `fromIni({ profile })`. `awsError()` maps SDK
  error names to friendly `{ status, message }`.
- **Endpoints** (`server/src/routes/*`): `loggers` (CRUD), `profiles` (parse names
  from `~/.aws/{config,credentials}`), `discovery` (`DescribeLogGroups` for
  autocomplete), `logs` (`FilterLogEvents`, paginated via `nextToken`), `tail`
  (`StartLiveTail` streamed over SSE — also appends each batch to the recordings store),
  `recordings` (list saved days + read one day's events newest-first).
- **Frontend** (`web/src`): a header **Stream / Recorded** toggle (`view` in `App.tsx`)
  switches the whole panel. Stream mode orchestrates two sub-modes — historical
  (`useLogs`) and live (`useLiveTail`) — swapping which event list `LogViewer` renders.
  Recorded mode (`RecordedView.tsx`) browses the on-disk NDJSON files (newest-first,
  with an NDJSON download). Hooks own data; components are presentational. `lib/api.ts`
  is the single typed fetch layer.

## Conventions

- **TypeScript strict everywhere.** No `any` in new code unless mirroring an SDK shape.
  `web/tsconfig.json` also has `noUnusedLocals`/`noUnusedParameters` on — unused
  imports fail the build.
- **ESM modules.** `server` is `"type": "module"`; use `.js` extensions on relative
  imports in server TS (e.g. `import { getClient } from "./aws.js"`). This is required
  by `moduleResolution: Bundler` + ESM and is easy to forget.
- **UI components are hand-built**, not from a CLI. There is **no** shadcn/ui install —
  the primitives in `web/src/components/ui.tsx` (Button, Input, Select, Badge, Switch)
  are shadcn-*style* but plain Tailwind, chosen to avoid an interactive generator and
  keep deps lean. Add new primitives there in the same style.
- **Styling** is Tailwind with a custom dark palette defined in `tailwind.config.js`
  (`bg.*`, `fg.*`, `border.*`, `accent`, `level.*`). Prefer these tokens over raw hex.
  The app is mono-font and dark-only by design.
- **Types are duplicated**, not shared via a package: `server/src/types.ts` and
  `web/src/lib/types.ts` are kept in sync by hand. If you change one (e.g. add a field
  to `Logger`), update the other.

## Gotchas / things learned the hard way

- **Port 4517, not 3001.** The conventional `3001` was already taken on the dev machine
  by another app, causing `EADDRINUSE`. The backend defaults to **4517**; override with
  `PORT`. If you change it, also update the proxy target in `web/vite.config.ts`.
- **Live tail needs the log group ARN, and the trailing `:*` must be stripped.**
  `DescribeLogGroups` returns ARNs like `...:log-group:/my/group:*`; `StartLiveTail`
  rejects that suffix. `routes/tail.ts` strips `:\*$` and caches the cleaned ARN on the
  logger record (`logGroupArn`) to avoid re-resolving.
- **SSE format matters.** `routes/tail.ts` emits named events (`open`, `session`,
  `log`, `error`, `end`) as `event: <name>\ndata: <json>\n\n`, with a `: ping` heartbeat
  every 15s and cleanup on `req.on("close")`. The frontend `useLiveTail` adds listeners
  per event name. Keep the names in sync across both files.
- **Empty results are normal, not a bug.** `FilterLogEvents` returns `{ events: [] }`
  when a log group has no events in the window. Don't treat empty as an error; the UI
  shows an empty state and suggests widening the range.
- **AWS SDK prints a `node >= 22` deprecation warning on Node 20.** It's benign — the
  SDK still works. Don't "fix" it by pinning or downgrading.
- **`DescribeLogGroups` may be denied** while `FilterLogEvents` is allowed. Autocomplete
  degrades gracefully (`discovery.ts` returns `{ logGroups: [], error }` with HTTP 200 on
  AccessDenied) so the user can still type a log group name manually. Preserve that.

## Where things live

| Need to change… | Look in |
| --- | --- |
| How logs are fetched / paginated | `server/src/routes/logs.ts`, `web/src/hooks/useLogs.ts` |
| Live tail streaming | `server/src/routes/tail.ts`, `web/src/hooks/useLiveTail.ts` |
| Recorded-log persistence / look-back | `server/src/recordings.ts`, `server/src/routes/recordings.ts`, `web/src/components/RecordedView.tsx` |
| Saved-logger storage | `server/src/store.ts` |
| Log-group autocomplete | `server/src/routes/discovery.ts`, `web/src/components/LogGroupCombobox.tsx` |
| Filter bar / time presets | `web/src/components/FilterBar.tsx` |
| How a log line renders | `web/src/components/LogRow.tsx`, `web/src/lib/log-format.ts` |
| UI primitives / theme | `web/src/components/ui.tsx`, `web/tailwind.config.js` |
