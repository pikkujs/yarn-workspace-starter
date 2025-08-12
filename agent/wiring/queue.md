# Queue Wiring Guide

This file defines **how to wire Pikku functions to background queues** using the generated adapter APIs in `./pikku-types.gen.ts`.

The Queue adapter is responsible for:
- Subscribing a worker to a named queue.
- Delivering each job payload as the function’s `data`.
- Honoring the function’s `auth` and `permissions` (usually unnecessary for internal jobs).

Domain logic stays **entirely** in `packages/functions/src/functions/**/*.function.ts`.

---

## File naming

- Queue wiring files must end with `.queue.ts`.
- Files can live anywhere under `packages/functions/src/`.
- You may group multiple **queue workers** in a single file (same-transport-only).

Examples:
```

packages/functions/src/email.queue.ts
packages/functions/src/billing.queue.ts

````

---

## Allowed imports in queue wiring files

- `wireQueueWorker` from `./pikku-types.gen.ts`
- Exported Pikku functions from `./functions/**/*.function.ts`
- Optional **middleware** from `./middleware.ts` (e.g., audit/tracing)
- Optional `config` for queue names/concurrency

**Disallowed**
- Importing from `./services/**`
- Business logic (keep wiring thin)
- Direct env/globals access

---

## Functions used by queue workers

- Prefer **sessionless** functions. If there is no return value, **don’t** map `void` explicitly use void for the `Out` generic.
- Keep functions thin; if a worker would only call one existing function via RPC, **don’t create a wrapper**—wire that existing function directly.
- Don’t add manual auth checks; workers are internal.

---

## Basic queue wiring

```ts
// packages/functions/src/email.queue.ts
import { wireQueueWorker } from './pikku-types.gen.js'
import { sendEmail } from './functions/email.function.js'

wireQueueWorker({
  queue: 'email',
  func: sendEmail,
  // concurrency?: number
  // visibilityTimeoutSec?: number
})
````

---

## Grouping multiple workers in one file

```ts
// packages/functions/src/billing.queue.ts
import { wireQueueWorker } from './pikku-types.gen.js'
import { applyCharges, closeInvoice } from './functions/billing.function.js'

wireQueueWorker({ queue: 'billing.charge',  func: applyCharges })
wireQueueWorker({ queue: 'billing.finalize', func: closeInvoice })
```

> **Rule:** Do not mix transports. A `.queue.ts` file may contain multiple `wireQueueWorker(...)` calls, but no HTTP/Scheduler/etc.

---

## Example worker functions (concise patterns)

> Functions live under `packages/functions/src/functions/**/*.function.ts`.
> They must be `async`. If there’s no output, omit the `Out` generic.

```ts
// packages/functions/src/functions/email.function.ts
import { pikkuFuncSessionless } from '@pikku/core'

type SendEmailIn = { to: string; template: string; data: Record<string, unknown> }

export const sendEmail = pikkuFuncSessionless<SendEmailIn>({
  func: async ({ mailer }, job) => {
    await mailer.send(job.to, job.template, job.data)
  },
})
```

```ts
// packages/functions/src/functions/billing.function.ts
import { pikkuFuncSessionless } from '@pikku/core'

// If the shape is the same, embed it inline; no need for separate types.
export const applyCharges = pikkuFuncSessionless<{ invoiceId: string }>({
  func: async ({ /* chargeService */ }, data) => {
    // await chargeService.apply(data.invoiceId)
  },
})

export const closeInvoice = pikkuFuncSessionless<{ invoiceId: string }>({
  func: async ({ /* billingService */ }, data) => {
    // await billingService.close(data.invoiceId)
  },
})
```

> If a queue worker would only call an RPC like `rpc.invoke('applyCharges', {...})`, **wire `applyCharges` directly** instead of creating a wrapper that only forwards.

---

## Middleware for queues

Queues often provide their own retry/metrics; avoid duplicating that in app middleware.
Use middleware for **light concerns** like audit tags, tracing context, or payload redaction.

```ts
// packages/functions/src/email.queue.ts
import { wireQueueWorker } from './pikku-types.gen.js'
import { sendEmail } from './functions/email.function.js'
import { withJobAudit } from './middleware.js'

wireQueueWorker({
  queue: 'email',
  func: sendEmail,
  middleware: [withJobAudit],
})
```

**Example lightweight middleware**

```ts
// packages/functions/src/middleware.ts
import type { PikkuMiddleware } from '@pikku/core'

/**
 * Adds a minimal audit log without duplicating adapter-level metrics/retries.
 */
/**
 * Adds a minimal audit log without duplicating adapter-level metrics/retries.
 */
export const withJobAudit: PikkuMiddleware = async ({ logger }, interaction, next) => {
  const t0 = Date.now()
  try {
    await next()
    logger?.info?.('queue.audit', {
      route: interaction.route,
      ms: Date.now() - t0,
    })
  } catch (e) {
    logger?.warn?.('queue.audit.fail', {
      route: interaction.route,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : String(e),
    })
    throw e
  }
}
```

---

## Concurrency and visibility

* `concurrency` → max parallel jobs per worker process.
* `visibilityTimeoutSec` → how long a job stays invisible before retry (if supported by the backing queue).

Prefer sourcing from config:

```ts
// packages/functions/src/email.queue.ts
import { wireQueueWorker } from './pikku-types.gen.js'
import { sendEmail } from './functions/email.function.js'
import { createConfig } from './config.js'

const config = await createConfig()

wireQueueWorker({
  queue: 'email',
  func: sendEmail,
  concurrency: config.queues?.email?.concurrency ?? 10,
  visibilityTimeoutSec: config.queues?.email?.visibilityTimeoutSec ?? 300,
})
```

---

## Error handling

* Worker functions should throw `PikkuError` subclasses for expected failures.
* Let failures bubble so the queue runtime (and its adapter) can apply its native retry/DLQ policies.
* Use app middleware **only** for lightweight concerns (e.g., audit/tracing), not to reimplement retries/metrics already provided by the adapter/runtime.

---

## PR/CI checklist for Queue wiring

* [ ] File ends with `.queue.ts`.
* [ ] Adapter imports come **only** from `./pikku-types.gen.ts`.
* [ ] Imports limited to exported functions, optional middleware, optional config.
* [ ] No business logic or service imports in wiring.
* [ ] Worker functions are `async`; omit `void` generic when unused.
* [ ] Similar input shapes are embedded inline rather than split into redundant types.
* [ ] If grouping, only queue wirings in the file (no mixed transports).
* [ ] Middleware, if used, is lightweight (audit/tracing), not retries/metrics that the adapter handles.