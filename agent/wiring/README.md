```md
# Wiring Guides — Overview

This folder defines **how to wire Pikku functions to transports**. Wiring is a **thin binding layer**:
- **Only binding**: attach exported functions to transports.
- **No domain logic**: logic lives in `packages/functions/src/functions/**`.
- **No service imports**: services are assembled in `packages/functions/src/services.ts`.
- **Validation & error mapping**: handled by adapters; domain functions just throw `PikkuError` subclasses.

> Adapter APIs must be imported **only from `./pikku-types.gen.ts`**. Do **not** import `@pikku/core/*` in wiring files.

---

## File placement & naming (suffix-based; no transport folders)

Place wiring files anywhere under `packages/functions/src/`, using a **suffix that matches the transport**:

- HTTP: `*.http.ts`
- Channel (realtime): `*.channel.ts`
- Scheduler: `*.schedule.ts`
- Queue: `*.queue.ts`
- MCP: `*.mcp.ts`

**Examples**
```

packages/functions/src/get-card.http.ts
packages/functions/src/maintenance.schedule.ts
packages/functions/src/email.queue.ts
packages/functions/src/code-search.mcp.ts
packages/functions/src/chat.channel.ts

````

---

## One file vs many files

You may group **multiple wirings of the same transport** in one file.  
**Never** mix different transports in one file. The file suffix must match the transport.

Control the default via `pikku.config.json`:

```json
{
  "agent": {
    "filePerWire": false
  }
}
````

* `true`  → Prefer one file per wiring (e.g., each route in its own `.http.ts`).
* `false` → Allow grouping multiple same-transport wirings per file.

**Correct**

```ts
// ✅ Multiple HTTP routes — single .http.ts file
// packages/functions/src/app.http.ts
import { wireHTTP } from './pikku-types.gen.js'
import { getCard } from './functions/get-card.function.js'
import { listCards } from './functions/list-cards.function.js'

wireHTTP({ method: 'get', route: '/v1/cards/:cardId', func: getCard })
wireHTTP({ method: 'get', route: '/v1/cards', func: listCards })
```

```ts
// ✅ Multiple schedulers — single .schedule.ts file
// packages/functions/src/maintenance.schedule.ts
import { wireScheduler } from './pikku-types.gen.js'
import { runMaintenance } from './functions/run-maintenance.function.js'
import { rotateKeys } from './functions/rotate-keys.function.js'

wireScheduler({ cron: '0 3 * * *', func: runMaintenance })
wireScheduler({ cron: '0 4 * * 0', func: rotateKeys })
```

**Incorrect**

```ts
// ❌ Mixing transports in one file — not allowed
// packages/functions/src/app-wiring.http.ts
import { wireHTTP, wireScheduler } from './pikku-types.gen.js' // Don't do this
```

---

## Allowed imports in wiring files

* Adapter APIs from `./pikku-types.gen.ts` (e.g., `wireHTTP`, `wireScheduler`, `wireQueueWorker`, `wireMCPResource`, `wireMCPTool`, `wireMCPPrompt`, `wireChannel`, etc.)
* Exported **functions** from `./functions/*.function.ts`
* **Permissions** from `./permissions.ts`
* **Middleware** from `./middleware.ts`
* **Config** (if needed for prefixes/tags)

**Disallowed**

* Anything from `./services/**`
* Business/domain logic
* Direct env/globals

---

## Core rules (apply to every transport)

1. **Thin adapters** — Wiring binds a function; if extra behavior is needed, create/compose a domain function and import that.
2. **Auth & permissions** — Prefer the function’s own `auth`/`permissions`. Add transport-only middleware only when necessary (e.g., cookie persistence after login).
3. **Validation at the edge** — Adapters merge/validate inputs; domain assumes validated, typed `data`.
4. **Error propagation** — Domain throws `PikkuError` subclasses; adapters translate to responses. Don’t set status codes in wiring.
5. **Session** — Set the logical session via `userSession.set(...)` in the function (any protocol). Persist via transport middleware (e.g., HTTP cookie) after the function runs.

---

## Minimal per-transport examples (using `pikku-types.gen.ts`)

### HTTP

```ts
// packages/functions/src/get-card.http.ts
import { wireHTTP } from './pikku-types.gen.js'
import { getCard } from './functions/get-card.function.js'
import { persistSession } from './middleware.js' // optional

wireHTTP({
  method: 'get',
  route: '/v1/cards/:cardId',
  func: getCard,
  middleware: [persistSession],
})
```

### Scheduler (cron)

```ts
// packages/functions/src/maintenance.schedule.ts
import { wireScheduler } from './pikku-types.gen.js'
import { runMaintenance } from './functions/run-maintenance.function.js'

wireScheduler({
  cron: '0 3 * * *',
  func: runMaintenance, // usually a small sessionless function that orchestrates via RPC
})
```

### Queue

```ts
// packages/functions/src/email.queue.ts
import { wireQueueWorker } from './pikku-types.gen.js'
import { sendEmail } from './functions/send-email.function.js'

wireQueueWorker({
  queue: 'email',
  func: sendEmail,
  // concurrency?: number, visibilityTimeoutSec?: number
})
```

### MCP (resource/tool/prompt)

```ts
// packages/functions/src/code-search.mcp.ts
import { wireMCPResource, wireMCPTool, wireMCPPrompt } from './pikku-types.gen.js'
import { searchCode } from './functions/search-code.function.js'
import { annotateFile } from './functions/annotate-file.function.js'
import { buildReviewPrompt } from './functions/build-review-prompt.function.js'

wireMCPResource(searchCode)
wireMCPTool(annotateFile)
wireMCPPrompt(buildReviewPrompt)
```

### Channel (realtime) — (full guide in `channel.md`)

```ts
// packages/functions/src/chat.channel.ts
import { wireChannel } from './pikku-types.gen.js'
import { onConnect, onDisconnect, onMessage } from './functions/chat-handlers.function.js'

wireChannel({
  name: 'chat',
  onConnect,
  onDisconnect,
  onMessage,
})
```

---

## PR/CI checklist for wiring files

* [ ] File path ends with the correct suffix (`.http.ts`, `.schedule.ts`, `.queue.ts`, `.mcp.ts`, `.channel.ts`).
* [ ] Adapter imports come **only** from `./pikku-types.gen.ts`.
* [ ] Imports limited to exported functions, permissions, middleware (and optional config).
* [ ] No services imported; no domain logic in wiring.
* [ ] Uses function-level `auth`/`permissions` unless a transport-only concern.
* [ ] No validation or status codes written in wiring.
* [ ] If `agent.filePerWire = true`, files are split; otherwise grouping is same-transport only.

---

```
```
