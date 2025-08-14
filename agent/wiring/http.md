# HTTP Wiring Guide

This file defines **how to wire Pikku functions to HTTP routes** using the generated adapter APIs in `./pikku-types.gen.ts`.

The HTTP adapter is responsible for:
- Matching incoming HTTP requests to a function.
- Merging path/query/body into the `data` parameter.
- Enforcing `auth` and `permissions` defined on the function.
- Returning typed responses or mapped `PikkuError`s.

Domain logic stays **entirely** in `packages/functions/src/functions/**/*.function.ts`.

---

## File naming

- All HTTP wiring files must end with `.http.ts`.
- Files can live anywhere under `packages/functions/src/`.
- You may group multiple **HTTP routes** in a single file **only if** `agent.filePerWire` is `false` in `pikku.config.json`.

Examples:
```

packages/functions/src/get-card.http.ts
packages/functions/src/cards.http.ts       # grouped HTTP routes

````

---

## Function import patterns

Functions don’t need to be one-per-file. You can export multiple Pikku functions from a single `*.function.ts` and import what you need. Tree-shaking will drop unused exports.

```ts
// packages/functions/src/functions/board.function.ts
export const getCard = /* pikkuFunc({...}) */
export const listCards = /* pikkuFunc({...}) */
export const createCard = /* pikkuFunc({...}) */
````

```ts
// packages/functions/src/cards.http.ts
import { wireHTTP } from './pikku-types.gen.js'
import { getCard, listCards } from './functions/board.function.js'

wireHTTP({ method: 'get', route: '/v1/cards/:cardId', func: getCard })
wireHTTP({ method: 'get', route: '/v1/cards', func: listCards })
```

> **Glob for functions:** `./functions/**/*.function.ts`

---

## Allowed imports in HTTP wiring files

From **wiring files**:

* `wireHTTP` (and HTTP helpers) from `./pikku-types.gen.ts`
* Exported Pikku functions from `./functions/**/*.function.ts`
* `permissions` from `./permissions.ts`
* `middleware` from `./middleware.ts`
* `config` for routing prefixes or tags

**Never**:

* Import from `./services/**`
* Implement business logic here

---

## Basic HTTP wiring

```ts
// packages/functions/src/get-card.http.ts
import { wireHTTP } from './pikku-types.gen.js'
import { getCard } from './functions/board.function.js'

wireHTTP({
  method: 'get',             // 'get' | 'post' | 'put' | 'patch' | 'delete'
  route: '/v1/cards/:cardId',
  func: getCard,
})
```

---

## Per-route middleware

```ts
// packages/functions/src/login.http.ts
import { wireHTTP } from './pikku-types.gen.js'
import { login } from './functions/auth.function.js'
import { persistSession } from './middleware.js'

wireHTTP({
  method: 'post',
  route: '/v1/login',
  func: login,
  middleware: [persistSession], // e.g., write Set-Cookie after login
})
```

---

## Global and prefix HTTP middleware

Use `addHTTPMiddleware` from `@pikku/core` to apply middleware globally or to a route prefix.

```ts
import { addHTTPMiddleware } from '@pikku/core'
import { cookieMiddleware, apiKeyMiddleware } from './middleware.js'

// Prefix-scoped middleware
addHTTPMiddleware('/admin', [cookieMiddleware(), apiKeyMiddleware()])

// Global middleware
addHTTPMiddleware([cookieMiddleware(), apiKeyMiddleware()])
```

* **First argument** (string) → route prefix to scope middleware (e.g., `/admin`)
* **Omit first argument** → applies globally to all HTTP routes

---

## Path, query, and body parameters

* **Path params** come from `:param` syntax in route.
* **Query params** are merged if they match function input names.
* **Body** is parsed as JSON for non-GET methods.

```ts
// GET /v1/cards/123?includeDetails=true
wireHTTP({
  method: 'get',
  route: '/v1/cards/:cardId',
  func: getCard,
})
// → data = { cardId: '123', includeDetails: true }
```

---

## Permissions and auth

HTTP wiring honors the function’s own `auth` (default `true`) and `permissions`. Only override for transport-specific needs.

```ts
import { wireHTTP } from './pikku-types.gen.js'
import { updateCard } from './functions/board.function.js'
import { requireOwner } from './permissions.js'

wireHTTP({
  method: 'patch',
  route: '/v1/cards/:cardId',
  func: updateCard,
  permissions: [requireOwner], // Optional transport-specific override
})
```

---

## Server-Sent Events (SSE) and progressive enhancement

You can progressively enhance HTTP GET routes with SSE by setting `sse: true`.

* Must be a `GET` route.
* A `services.channel` is injected. For **`pikkuFunc`**, this channel is **optional**.
* The **function’s `Out` type** is also the SSE channel message type.

```ts
// packages/functions/src/functions/progressive.function.ts
import { pikkuFuncSessionless } from '@pikku/core'

export const progressiveEnhancementExample = pikkuFuncSessionless<
  void,
  { state: 'initial' | 'pending' | 'done' }
>({
  func: async (services) => {
    if (services?.channel) {
      setTimeout(() => services.channel?.send({ state: 'pending' }), 2500)
      setTimeout(() => services.channel?.send({ state: 'done' }), 5000)
    }
    return { state: 'initial' }
  },
})
```

```ts
// packages/functions/src/status.http.ts
import { wireHTTP } from './pikku-types.gen.js'
import { progressiveEnhancementExample } from './functions/progressive.function.js'

wireHTTP({
  auth: false,
  method: 'get',
  route: '/status/http',
  func: progressiveEnhancementExample,
  sse: true, // GET-only; channel sends use the Out type
})
```

---

## Choosing between `pikkuFunc` and `pikkuChannelFunc`

* **Progressive enhancement (HTTP + optional SSE):**
  Use **`pikkuFunc` / `pikkuFuncSessionless`**. The channel is **optional** (`services.channel?`). Works over plain HTTP, and if SSE is enabled (`sse: true`), you can send incremental updates without breaking non-SSE clients.

* **Always-realtime (channel must exist):**
  Use **`pikkuChannelFunc`** when the function **expects a channel to always be present** (e.g., dedicated WebSocket flows, or HTTP/SSE routes where the presence of a channel is guaranteed and required). This makes the channel **required** in the function signature.

* **Need both HTTP and WS:**
  Keep business logic in a regular `pikkuFunc` and call it from your channel handler via `rpc.invoke(...)`. That avoids duplication and keeps one source of truth.

Example channel handler:

```ts
import { pikkuChannelFunc } from '@pikku/core'

export const handleChatMessage = pikkuChannelFunc<{ message: string }, void>({
  func: async ({ logger, channel }, input) => {
    logger.info('Chat message', { channelId: channel.channelId, msg: input.message })
  },
})
```

---

## Grouped HTTP routes in one file

```ts
// packages/functions/src/cards.http.ts
import { wireHTTP } from './pikku-types.gen.js'
import { getCard, listCards, createCard } from './functions/board.function.js'
import { persistSession } from './middleware.js'

wireHTTP({ method: 'get', route: '/v1/cards/:cardId', func: getCard })
wireHTTP({ method: 'get', route: '/v1/cards', func: listCards })
wireHTTP({
  method: 'post',
  route: '/v1/cards',
  func: createCard,
  middleware: [persistSession],
})
```

---

## PR/CI checklist for HTTP wiring

* [ ] File name ends in `.http.ts`.
* [ ] Adapter imports come **only** from `./pikku-types.gen.ts`.
* [ ] **CRITICAL**: Functions use `pikkuFunc` imported from `#pikku/pikku-types.gen.js`, never from `@pikku/core`.
* [ ] **CRITICAL**: SSE routes must set `sse: true` in `wireHTTP` configuration.
* [ ] Imports limited to exported functions (`./functions/**/*.function.ts`), permissions, middleware, config.
* [ ] No business logic or service imports.
* [ ] Function-level `auth`/`permissions` are respected.
* [ ] No manual validation or status code handling.
* [ ] **Every function wired has `docs` with `summary`, `description`, `tags`, and `errors`.**
* [ ] Middleware use (`wireHTTP.middleware` or `addHTTPMiddleware`) follows scope rules.
* [ ] If `agent.filePerWire = true`, one route per file; else grouping is same-transport only.
* [ ] SSE routes are `GET` only; for `pikkuFunc` the channel is optional; if you require a channel, prefer `pikkuChannelFunc`.
