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

**No manual auth presence checks.** Rely on `auth: true` and permissions/middleware. Use `session` only for business rules (e.g., scoping).

**Errors are thrown, not returned.** Use classes that extend `PikkuError`, with clear messages.

**Cross-function calls** must go through `rpc.invoke('<ExactExportName or name override>', input)`. Do **not** import another exported Pikku function directly.

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

import { InMemoryStore } from './services/store.js' // class/interface, Pikku-agnostic

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

**Service modules** (in `services/**`) must not import `@pikku/*`. Only `services.ts` wires them.

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

Throw with a clear message e.g.:

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
  permissions: { default: [requireOwner] }, // or a single PikkuPermission
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

---

## userSession

* Set session attributes inside **any** protocol using the `userSession` service; persistence is handled by middleware (e.g., cookie for HTTP).
* Do **not** manually check for session presence in functions. Rely on `auth` and permissions.

**HTTP login example (sets session):**

```ts
// packages/functions/src/functions/login.function.ts
import { pikkuFuncSessionless } from '@pikku/core'
import { ForbiddenError } from '../errors.js'

type In  = { email: string; password: string }
type Out = { ok: true }

export const login = pikkuFuncSessionless<In, Out>({
  auth: false,
  expose: true,
  func: async ({ authService, userSession }, data) => {
    const user = await authService.verifyPassword(data.email, data.password)
    if (!user) throw new ForbiddenError('Invalid credentials')
    await userSession?.set({ userId: user.id, roles: user.roles })
    return { ok: true }
  },
})
```

**Middleware persists session (e.g., cookie):**

```ts
// packages/functions/src/middleware.ts
export const persistSession: PikkuMiddleware = async ({ userSession }, interaction, next) => {
  await next()
  const session = await userSession.get()
  interaction.setCookie?.('pikku_session', session, { httpOnly: true, sameSite: 'lax' })
}
```

---

## Canonical function examples

**Read (exposed RPC):**

```ts
// packages/functions/src/functions/get-card.function.ts
import { pikkuFunc } from '@pikku/core'
import { NotFoundError } from '../errors.js'

type In  = { cardId: string }
type Out = { id: string; boardId: string; columnId: string; order: number; title: string }

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
// packages/functions/src/functions/move-card.function.ts
import { pikkuFunc } from '@pikku/core'

type In  = { cardId: string; toColumnId: string; toOrder: number }
type Out = { ok: true }

export const moveCard = pikkuFunc<In, Out>({
  func: async ({ store, rpc }, data, session) => {
    const card = await rpc.invoke('getCard', { cardId: data.cardId }) // will throw NotFoundError if missing
    store.setCard({ ...card, columnId: data.toColumnId, order: data.toOrder })
    return { ok: true }
  },
  permissions: {}, // add real permissions as needed
})
```

**Sessionless health:**

```ts
// packages/functions/src/functions/health.function.ts
import { pikkuFuncSessionless } from '@pikku/core'

export const health = pikkuFuncSessionless<void, { status: string }>({
  auth: false,
  expose: true,
  docs: { description: 'Basic health check' },
  func: async () => ({ status: 'ok' }),
})
```

---

## Required API docs on every function

Every Pikku function **must** include documentation via the `docs` field. This is used for:

* Generated API documentation
* Deployment filtering (via `tags`)
* Static analysis of **which errors** a function can throw

Recommended shared type:

```ts
export type APIDocs = {
  summary?: string;
  description?: string;
  tags?: string[];   // Used to filter HTTP deployment surface
  errors?: string[]; // Names of error classes this function can throw
};
```

Attach to functions via `docs`:

```ts
import { pikkuFunc } from '@pikku/core'
import { NotFoundError } from '../errors.js'

type GetCardIn  = { cardId: string }
type GetCardOut = { id: string; boardId: string; columnId: string; order: number; title: string }

export const getCard = pikkuFunc<GetCardIn, GetCardOut>({
  expose: true,
  docs: {
    summary: 'Fetch a single card by id',
    description: 'Returns the card and its placement metadata. Throws NotFoundError when the card does not exist.',
    tags: ['cards', 'read'],
    errors: ['NotFoundError'],
  },
  func: async ({ store }, data) => {
    const card = store.getCard(data.cardId)
    if (!card) throw new NotFoundError('Card not found error')
    return card
  },
})
```

---

## Review checklist (agent must enforce)

* [ ] Functions live under `packages/functions/src/functions/**` and end with `.function.ts`.
* [ ] `func` is `async` and **destructures** services in the parameter list.
* [ ] No wiring/adapters/env/globals in function files.
* [ ] Cross-function calls use `rpc.invoke` with the **exact** exported name (or `name` override), and do **not** duplicate callee checks/errors.
* [ ] Services are classes/interfaces in `services/**`, Pikku-agnostic; assembled only in `services.ts`.
* [ ] `createSingletonServices` / `createSessionServices` signatures match current API.
* [ ] Errors extend `PikkuError`, include messages; no raw `Error`/strings.
* [ ] No `any` or `@ts-ignore`.