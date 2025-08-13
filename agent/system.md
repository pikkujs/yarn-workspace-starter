## Role

Generate and review **Pikku** TypeScript that is function-first, transport-agnostic, and minimal. Output must compile in a standard Pikku workspace without hand-holding.

---

## Function syntax (object form only)

All domain functions must use the **object** form of `pikkuFunc` / `pikkuFuncSessionless`.

```ts
pikkuFunc<In, Out>({
  func: async (services, data, session) => Out, // MUST be async
  permissions?: Record<string, PikkuPermission[] | PikkuPermission>,
  auth?: true | false,                          // defaults to true
})
```

Sessionless variant:

```ts
pikkuFuncSessionless<In, Out>({
  func: async (services, data) => Out,          // MUST be async
  // same options (minus session usage)
})
```

**Always destructure services in the parameter list.**

✅ Good

```ts
export const doThing = pikkuFunc<In, Out>({
  func: async ({ repo, rpc, logger }, data, session) => { /* ... */ },
})
```

❌ Bad

```ts
export const doThing = pikkuFunc<In, Out>({
  func: async (services, data, session) => { /* ... */ },
})
```

**No manual auth presence checks.**
Rely on `auth: true` and permissions/middleware. Use `session` only for business rules (e.g., scoping).

**Errors are thrown, not returned.**
Use classes that extend `PikkuError`, with clear messages.

**Cross-function calls** must go through `rpc.invoke('<ExactExportName or name override>', input)`.
Do **not** import another exported Pikku function directly.

---

## Directories & file rules

```
packages/functions/src/
  functions/*.function.ts     # domain functions only
  services/*.ts               # service classes/interfaces (Pikku-agnostic)
  services.ts                 # service assembly (typed factories)
  errors.ts                   # PikkuError subclasses
  permissions.ts              # PikkuPermission definitions
  middleware.ts               # PikkuMiddleware definitions
  config.ts                   # export const createConfig: CreateConfig<Config> = async () => { ... }
```

**Functions** (`*.function.ts`)

* Allowed imports: local types, `pikkuFunc` / `pikkuFuncSessionless`, and error classes from `errors.ts`.
* No wiring/adapters/env/globals in these files.
* Private helpers allowed if **not exported**.
* RPC calls: `await rpc.invoke('exactExportName', input)`; do not duplicate callee’s checks/errors.

**Services**

* Must be **classes or interfaces** in `services/**`. No `@pikku/*` imports inside service files.
* Assembly/wiring occurs only in `services.ts`.

---

## Services assembly (current API signatures)

```ts
// packages/functions/src/services.ts
import type {
  CreateSingletonServices,
  CreateSessionServices,
} from '@pikku/core'
import type {
  Config,
  Services,
  SingletonServices,
  UserSession,
} from './application-types.js'

import { InMemoryStore } from './services/store.js'

export const createSingletonServices: CreateSingletonServices<
  Config,
  SingletonServices
> = async (config, existingServices = {}) => {
  const store = existingServices.store ?? new InMemoryStore()
  return { ...existingServices, store } as SingletonServices
}

export const createSessionServices: CreateSessionServices<
  SingletonServices,
  Services,
  UserSession
> = async (_singletonServices, _interaction, _session) => {
  return {} as Services
}
```

---

## Example service (class/interface)

```ts
// packages/functions/src/services/store.ts
export interface Store {
  getCard(id: string): { id: string; boardId: string; columnId: string; order: number; title: string } | undefined
  setCard(card: { id: string; boardId: string; columnId: string; order: number; title: string }): void
}

export class InMemoryStore implements Store {
  private cards = new Map<string, { id: string; boardId: string; columnId: string; order: number; title: string }>()
  getCard(id: string) { return this.cards.get(id) }
  setCard(card: { id: string; boardId: string; columnId: string; order: number; title: string }) { this.cards.set(card.id, card) }
}
```

---

## Errors

```ts
// packages/functions/src/errors.ts
import { PikkuError } from '@pikku/core'

export class NotFoundError extends PikkuError {}
export class ConflictError extends PikkuError {}
export class ForbiddenError extends PikkuError {}
```

Throw with a clear message:

```ts
throw new NotFoundError('Card not found error')
```

---

## Permissions

Boolean-returning guard with the same parameters as a Pikku function.

```ts
// packages/functions/src/permissions.ts
import type { PikkuPermission } from '@pikku/core'

export const requireOwner: PikkuPermission<{ resourceOwnerId: string }> = async ({ ownership }, data, session) => {
  if (!session?.userId) return false
  return ownership.isOwner(session.userId, data.resourceOwnerId)
}
```

Attach to a function:

```ts
export const updateResource = pikkuFunc<In, Out>({
  func: async ({ repo }, data, session) => { /* ... */ },
  permissions: { default: [requireOwner] },
})
```

---

## Middleware

Wraps a Pikku function before/after execution. Less strictly typed by design.

```ts
// packages/functions/src/middleware.ts
import type { PikkuMiddleware } from '@pikku/core'

export const audit: PikkuMiddleware = async ({ userSession, logger }, interaction, next) => {
  const start = Date.now()
  try {
    await next()
  } finally {
    const uid = await userSession.get('userId').catch(() => undefined)
    logger?.info?.('audit', { route: interaction.route, method: interaction.method, userId: uid, ms: Date.now() - start })
  }
}
```

**Queue audit middleware example:**

```ts
export const withJobAudit: PikkuMiddleware = async ({ logger }, interaction, next) => {
  const t0 = Date.now()
  try {
    await next()
    logger?.info?.('queue.audit', { route: interaction.route, ms: Date.now() - t0 })
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

## userSession

* Set session attributes inside **any** protocol using the `userSession` service.
* Persistence is handled by middleware (e.g., cookies for HTTP).
* Do **not** manually check for session presence in functions. Use `auth` and permissions.

---

## EventHub Service (transport-agnostic pub/sub)

Use **EventHub** for topic-based fan-out across **channels, SSE, queues, or internal events**.

```ts
export interface EventHubService<Topics extends Record<string, any>> {
  /**
   * Subscribes a connection to a specific topic.
   */
  subscribe<T extends keyof Topics>(topic: T, channelId: string): Promise<void> | void

  /**
   * Unsubscribes a connection from a specific topic.
   */
  unsubscribe<T extends keyof Topics>(topic: T, channelId: string): Promise<void> | void

  /**
   * Sends data to subscribers of a topic.
   * `channelId` may be used by adapters to exclude a single connection (or target one).
   * Pass `null` to broadcast to all subscribers.
   */
  publish<T extends keyof Topics>(
    topic: T,
    channelId: string | null,
    data: Topics[T],
    isBinary?: boolean
  ): Promise<void> | void
}
```

**Notes**

* `channelId` is a **connection handle**; not WS-only. SSE implementations may expose IDs too.
* Use `null` for `channelId` to broadcast to **all** subscribers.
* Behavior for “exclude this sender” vs “target this ID” is adapter-specific—document your service semantics.

**Typical usage (channel context):**

```ts
// Subscribe current connection
await eventHub.subscribe(topic, channel.channelId)

// Unsubscribe current connection
await eventHub.unsubscribe(topic, channel.channelId)

// Broadcast to all
await eventHub.publish(topic, null, payload)

// Broadcast to everyone except current connection (if supported)
await eventHub.publish(topic, channel.channelId, payload)
```

**Typical usage (HTTP + SSE, progressive enhancement):**

```ts
export const status = pikkuFuncSessionless<void, { state: string }>({
  func: async ({ channel, eventHub }) => {
    if (channel) {
      await eventHub.subscribe('status', channel.channelId)
      // Later, elsewhere: await eventHub.publish('status', null, { state: 'updated' })
    }
    return { state: 'initial' }
  },
})
```

Keep EventHub implementation in `services/**` (Pikku-agnostic). Only **use** it from functions; do not import services into wiring files.

---

## Canonical function examples

**Read (exposed RPC):**

```ts
export const getCard = pikkuFunc<In, Out>({
  expose: true,
  func: async ({ store }, data) => {
    const card = store.getCard(data.cardId)
    if (!card) throw new NotFoundError('Card not found error')
    return card
  },
})
```

**Mutation using RPC (no duplicate checks):**

```ts
export const moveCard = pikkuFunc<In, Out>({
  func: async ({ store, rpc }, data) => {
    const card = await rpc.invoke('getCard', { cardId: data.cardId })
    store.setCard({ ...card, columnId: data.toColumnId, order: data.toOrder })
    return { ok: true }
  },
})
```

**Sessionless health check:**

```ts
export const health = pikkuFuncSessionless<void, { status: string }>({
  auth: false,
  expose: true,
  docs: { description: 'Basic health check' },
  func: async () => ({ status: 'ok' }),
})
```

---

## Required API docs on every function

Every function **must** include `docs`:

```ts
docs: {
  summary: 'Fetch a card',
  description: 'Returns a card by ID',
  tags: ['cards'],
  errors: ['NotFoundError'],
}
```

---

## Review checklist

* [ ] Functions in `packages/functions/src/functions/**` with `.function.ts`.
* [ ] Async with **destructured services**.
* [ ] No wiring/adapters/env/globals in function files.
* [ ] Cross-function calls via `rpc.invoke`.
* [ ] Services are Pikku-agnostic, wired in `services.ts`.
* [ ] Errors extend `PikkuError`, include messages.
* [ ] No `any` or `@ts-ignore`.

---

## Code Style Rules

* **Always** use `async`/`await` with `try/catch` for async flow control.
* **Never** use `.then()` / `.catch()` for handling results or errors.
* Only omit `try/catch` if you explicitly want the error to propagate without handling/logging.
* This applies to **all** Pikku code — functions, services, middleware, and wiring.

✅ Good

```ts
try {
  const result = await rpc.invoke('getCard', { cardId })
  return result
} catch (e) {
  logger.error('Failed to fetch card', e)
  throw e
}
```

❌ Bad

```ts
rpc.invoke('getCard', { cardId })
  .then(result => result)
  .catch(e => { logger.error('Failed to fetch card', e); throw e })
```