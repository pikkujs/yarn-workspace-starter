# Scheduler Wiring Guide

This file defines **how to wire Pikku functions to scheduled tasks** using the generated adapter APIs in `./pikku-types.gen.ts`.

The Scheduler adapter is responsible for:
- Registering cron-like schedules.
- Invoking your exported function on schedule.

> Observability (logging/metrics/retries) is **not automatic**. Attach a **PikkuMiddleware** either per-schedule or globally (see `addSchedulerMiddleware` below).

Domain logic stays **entirely** in `packages/functions/src/functions/**/*.function.ts`.

---

## File naming

- All scheduler wiring files must end with `.schedule.ts`.
- Files can live anywhere under `packages/functions/src/`.
- You may group multiple **scheduler registrations** in a single file (same-transport-only grouping).

Examples:
```

packages/functions/src/maintenance.schedule.ts
packages/functions/src/housekeeping.schedule.ts

````

---

## Allowed imports in scheduler wiring files

- `wireScheduler`, `addSchedulerMiddleware` from `./pikku-types.gen.ts`
- Exported Pikku functions from `./functions/**/*.function.ts`
- **Middleware** from `./middleware.ts` (logging/metrics/retry policies)
- Optional `config` for cron strings or feature flags

**Disallowed**
- Importing from `./services/**`
- Implementing business logic here
- Direct env/globals access

---

## Functions used by Scheduler

- **Signature requirement:** Cron jobs must use `pikkuFuncSessionless<void, void>` — aliased as **`pikkuVoidFunc`**.
- Keep the job **thin**; orchestrate via `rpc.invoke('ExactExportName', input)` if needed.
- Don’t perform manual auth checks; jobs are internal.

---

## Basic scheduler wiring

```ts
// packages/functions/src/maintenance.schedule.ts
import { wireScheduler } from './pikku-types.gen.js'
import { runMaintenance } from './functions/maintenance.function.js'

wireScheduler({
  cron: '0 3 * * *', // 03:00 UTC daily
  func: runMaintenance,
})
````

---

## Attaching middleware

### Per-schedule middleware

```ts
// packages/functions/src/maintenance.schedule.ts
import { wireScheduler } from './pikku-types.gen.js'
import { runMaintenance } from './functions/maintenance.function.js'
import { withSchedulerMetrics } from './middleware.js'

wireScheduler({
  cron: '0 3 * * *',
  func: runMaintenance,
  middleware: [withSchedulerMetrics], // wraps this schedule only
})
```

### Global middleware for all schedules

Use `addSchedulerMiddleware` (global hook).

```ts
// packages/functions/src/scheduler-bootstrap.schedule.ts
import { addSchedulerMiddleware } from './pikku-types.gen.js'
import { withSchedulerMetrics } from './middleware.js'
import { withRetry } from './middleware.js'

addSchedulerMiddleware([withSchedulerMetrics, withRetry])
```

> Order matters: middlewares run in array order (outer → inner), then your job.

**Example middleware**

```ts
// packages/functions/src/middleware.ts
import type { PikkuMiddleware } from '@pikku/core'

export const withSchedulerMetrics: PikkuMiddleware = async ({ logger }, interaction, next) => {
  const start = Date.now()
  try {
    await next()
    logger?.info?.('scheduler.run', { route: interaction.route, ms: Date.now() - start, ok: true })
  } catch (err) {
    logger?.error?.('scheduler.error', {
      route: interaction.route,
      ms: Date.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

// naive example retry wrapper
export const withRetry: PikkuMiddleware = async (_s, _i, next) => {
  let attempts = 0
  for (;;) {
    try {
      return await next()
    } catch (e) {
      if (++attempts >= 3) throw e
      await new Promise(r => setTimeout(r, 500 * attempts))
    }
  }
}
```

---

## Grouping multiple schedules in one file

```ts
// packages/functions/src/housekeeping.schedule.ts
import { wireScheduler } from './pikku-types.gen.js'
import { runMaintenance, rotateKeys } from './functions/maintenance.function.js'

wireScheduler({ cron: '0 3 * * *', func: runMaintenance })
wireScheduler({ cron: '0 4 * * 0', func: rotateKeys }) // Sundays at 04:00 UTC
```

> **Rule:** Do not mix transports. A `.schedule.ts` file may contain multiple `wireScheduler(...)` calls, but no HTTP/Queue/etc. wirings.

---

## Example job functions (use `pikkuVoidFunc`)

```ts
// packages/functions/src/functions/maintenance.function.ts
import { pikkuVoidFunc } from '@pikku/core'

export const runMaintenance = pikkuVoidFunc({
  func: async ({ rpc }) => {
    // await rpc.invoke('compactData', {})
    // await rpc.invoke('reindexSearch', {})
    // await rpc.invoke('pruneExpired', {})
  },
})

export const rotateKeys = pikkuVoidFunc({
  func: async ({ /* keyService */ }) => {
    // await keyService.rotate()
  },
})
```

---

## Cron expressions

* Standard 5-field syntax: `min hour dom month dow`, interpreted as **UTC** (unless your runtime says otherwise).
* Prefer sourcing cron strings from `createConfig()` when they vary by environment.

```ts
// packages/functions/src/maintenance.schedule.ts
import { wireScheduler } from './pikku-types.gen.js'
import { runMaintenance } from './functions/maintenance.function.js'
import { createConfig } from './config.js'

const config = await createConfig()
wireScheduler({
  cron: config.scheduler?.maintenanceCron ?? '0 3 * * *',
  func: runMaintenance,
})
```

---

## PR/CI checklist for Scheduler wiring

* [ ] File name ends in `.schedule.ts`.
* [ ] Adapter imports come **only** from `./pikku-types.gen.ts`.
* [ ] Imports limited to exported functions, middleware, and optional config.
* [ ] No business logic or service imports in wiring.
* [ ] Cron job functions use `pikkuVoidFunc` (`pikkuFuncSessionless<void, void>`).
* [ ] Cron expressions are explicit or sourced from config.
* [ ] If grouping, only scheduler wirings in the file (no mixed transports).
* [ ] If observability is required, attach **per-schedule middleware** and/or global `addSchedulerMiddleware([...])`.
