# Channel (Realtime) Wiring Guide

This file explains **how to wire realtime channels** using the generated adapter APIs in `./pikku-types.gen.ts`.

Channel wiring is a **thin binding layer** that:
- Registers channel handlers (connect, disconnect, message, routed actions).
- Keeps domain logic in `packages/functions/src/functions/**/*.function.ts`.
- Never imports services directly from wiring.

---

## File naming

- Channel wiring files must end with `.channel.ts`.
- Files can live anywhere under `packages/functions/src/`.
- You may group multiple **channels** per file (same-transport only).

Examples:
```

packages/functions/src/events.channel.ts
packages/functions/src/notifications.channel.ts

````

> Don’t mix transports in a single file.

---

## Allowed imports in channel wiring files

- `wireChannel` from `./pikku-types.gen.ts`
- Exported channel functions from `./functions/**/*.function.ts`:
  - `pikkuChannelConnectionFunc`
  - `pikkuChannelDisconnectionFunc`
  - `pikkuChannelFunc`
- Exported regular functions you wish to run in channel context (channel is optional inside them):
  - `pikkuFunc`
  - `pikkuFuncSessionless`
- Optional `permissions` from `./permissions.ts`
- Optional `middleware` from `./middleware.ts`

**Disallowed**
- Importing from `./services/**`
- Implementing business logic in wiring
- Using `config` for channel name/route — **hardcode these in wiring**

> Adapter APIs must come **only** from `./pikku-types.gen.ts`.

---

## Which API do I use?

- **Channel required** → Use `pikkuChannelFunc` (and `pikkuChannelConnectionFunc` / `pikkuChannelDisconnectionFunc`).  
- **Reuse domain logic** → You may wire a `pikkuFunc` / `pikkuFuncSessionless` to a channel action; inside those, `services.channel` is **optional**.
- **Need WS + HTTP** → Keep core logic in a `pikkuFunc` and call it via `rpc.invoke(...)` from channel handlers.

> For HTTP + SSE, see `http.md` (use `sse: true` on the route).

---

## Channel data vs. input

**ChannelData** = data the channel **opened with** (parsed from URL/path/query).  
This is not the message payload.

Generics:
- `pikkuChannelConnectionFunc<Out, ChannelData>`
- `pikkuChannelDisconnectionFunc<ChannelData>`
- `pikkuChannelFunc<In, Out, ChannelData>`

---

## `services.channel` (runtime shape)

Available inside channel-aware functions:

```ts
{
  channelId: string;                     // unique id for this connection
  openingData: OpeningData;              // ChannelData from URL/path/query at open
  send: (data: Out, isBinary?: boolean) => Promise<void> | void; // emit to this connection
  close: () => Promise<void> | void;     // close this connection
  state: 'initial' | 'open' | 'closed';  // lifecycle state
}
````

> `services.logger` is **not optional**. Use it.

---

## Automatic sending of return values

If a function is wired as a channel handler, **whatever it returns** is sent back to the client over the channel.
If you don’t want to send anything, return `undefined`/`void`.

---

## Channel function patterns (define in `functions/**/*.function.ts`)

```ts
// packages/functions/src/functions/events-handlers.function.ts
import {
  pikkuChannelConnectionFunc,
  pikkuChannelDisconnectionFunc,
  pikkuChannelFunc,
} from '@pikku/core'

// Connect — <Out, ChannelData>
export const onConnect = pikkuChannelConnectionFunc<{ welcome: string }, { clientType: string; room?: string }>({
  func: async ({ logger, channel }) => {
    logger.info('events.connect', { channelId: channel.channelId, opening: channel.openingData })
    return { welcome: 'connected' }
  },
})

// Disconnect — <ChannelData>
export const onDisconnect = pikkuChannelDisconnectionFunc<{ clientType: string; room?: string }>({
  func: async ({ logger, channel }) => {
    logger.info('events.disconnect', { channelId: channel.channelId, state: channel.state })
  },
})

// Message — <In, Out, ChannelData>
export const subscribe = pikkuChannelFunc<{ topic: string }, { ok: true }, { clientType: string }>({
  func: async ({ logger, channel }, { topic }) => {
    logger.info('events.subscribe', { topic, channelId: channel.channelId })
    // Optionally push an immediate update; return value will also be sent
    channel.send({ ok: true })
    return { ok: true }
  },
})

export const unsubscribe = pikkuChannelFunc<{ topic: string }, void, { clientType: string }>({
  func: async ({ logger, channel }, { topic }) => {
    logger.info('events.unsubscribe', { topic, channelId: channel.channelId })
  },
})
```

> Code style: **always** `await` with `try/catch` if handling errors; never `.then/.catch` (see `system.md`).

---

## Wiring a channel (with routed actions)

```ts
// packages/functions/src/events.channel.ts
import { wireChannel } from './pikku-types.gen.js'
import { onConnect, onDisconnect, subscribe, unsubscribe } from './functions/events-handlers.function.js'
import { audit } from './middleware.js'

wireChannel({
  // Unique channel name (typed client bindings depend on this)
  name: 'events',

  // HTTP route that upgrades to this channel (adapter-dependent)
  route: '/',

  // Lifecycle handlers
  onConnect,
  onDisconnect,

  // Channel-wide auth default (applies to actions unless overridden)
  auth: true,

  // Fallback message handler if no action wiring matches
  onMessage: unsubscribe, // example fallback

  // Action routing table (optional)
  onMessageWiring: {
    action: {
      subscribe: { func: subscribe },
      unsubscribe, // shorthand reference
    },
  },

  // Optional transport middleware (audit/tracing; keep it light)
  middleware: [audit],

  // Optional tags for deployment filtering
  tags: ['events'],
})
```

---

## Action Routing via `onMessageWiring` (optional, advanced)

`onMessageWiring` enables **message multiplexing** on a single channel.
When configured like:

```ts
onMessageWiring: {
  action: {
    subscribe: { func: subscribe },
    unsubscribe,
  },
}
```

the adapter expects message payloads to include an **`action`** property.
Examples:

```json
{ "action": "subscribe", "topic": "updates" }
```

→ invokes `subscribe`

```json
{ "action": "unsubscribe", "topic": "updates" }
```

→ invokes `unsubscribe`

**Why it exists**

* Reuse one WS connection for multiple behaviors.

**Why it’s not the default recommendation**

* Imposes a `{ action: string, ... }` envelope across clients.
* Obscures explicit mapping; typing is indirect without codegen.

Use it when you need multiplexing and a stable client protocol; otherwise favor explicit handlers or separate channels.

---

## Sessions and authentication

* Use `userSession` in **connect** (or a dedicated auth action) to set identity; rely on it later.
* Don’t manually check for session presence; rely on `auth`/permissions (on the function or per-action).
* Persistence is adapter-managed; add middleware for auditing/tracing if needed.

---

## Middleware (optional)

Attach **transport-specific** middleware (audit/tracing) in wiring. Don’t reimplement adapter-level metrics/retries.

```ts
// packages/functions/src/middleware.ts
import type { PikkuMiddleware } from '@pikku/core'

export const audit: PikkuMiddleware = async ({ logger, userSession }, interaction, next) => {
  const start = Date.now()
  try {
    await next()
  } finally {
    const userId = await userSession.get('userId').catch(() => undefined)
    logger.info('channel.audit', { route: interaction.route, userId, ms: Date.now() - start })
  }
}
```

---

## Permissions

* Prefer attaching `permissions` to the **function** definition.
* Add `permissions` in wiring only for transport-specific overrides.

---

## PR/CI checklist for Channel wiring

* [ ] File ends with `.channel.ts`.
* [ ] Adapter imports come **only** from `./pikku-types.gen.ts`.
* [ ] Imports limited to exported channel functions and/or regular Pikku functions, plus optional permissions/middleware.
* [ ] Channel `name` is unique; `route` is hardcoded (no config indirection).
* [ ] Generics correct: `pikkuChannelConnectionFunc<Out, ChannelData>`, `pikkuChannelDisconnectionFunc<ChannelData>`, `pikkuChannelFunc<In, Out, ChannelData>`.
* [ ] `services.channel` used correctly (`channelId`, `openingData`, `send`, `close`, `state`); `logger` is used.
* [ ] If using `onMessageWiring`, protocol includes `{ action: string, ... }` and is documented/typed.
* [ ] Code style rule respected (await + try/catch; no `.then/.catch`).