# Pikku System Rules

Authoritative rules for writing **Pikku** code that is function‑first, transport‑agnostic, and minimal.  
Output is expected to compile in a standard Pikku workspace without manual fixes.

---

## Function syntax (object form only)

All domain functions **must** use the object form of `pikkuFunc` / `pikkuFuncSessionless`.

```ts
pikkuFunc<In, Out>({
  func: async (services, data, session) => Out, // MUST be async
  permissions?: Record<string, PikkuPermission[] | PikkuPermission>,
  auth?: true | false,                          // defaults to true
  expose?: true | false,                        // if exposed as a public RPC/client API
  docs?: { summary: string; description?: string; tags?: string[]; errors?: string[] }
})
```

Sessionless variant:

```ts
pikkuFuncSessionless<In, Out>({
  func: async (services, data) => Out,          // MUST be async
  // same options (minus session usage)
})
```

**Rules**

- Always **destructure services** in the parameter list.
- No manual “is user authenticated?” checks; rely on `auth` (default `true`) and `permissions`/middleware.  
- Errors are **thrown, not returned**, and must extend `PikkuError`. See `errors-and-mapping.md`.
- Cross‑function calls must go through **`rpc.invoke('<ExactExportName>', input)`** — never import another Pikku function directly.
- If a function is part of a public client surface, set **`expose: true`** so the generated client types include it.

---

## RPC usage (explicit rule)

`rpc.invoke()` is **only** for **non‑trivial, reusable domain functions** (orchestration, transactions, shared validation/permissions, cross‑resource invariants, long‑running flows).  
For **simple CRUD or one‑service calls**, call the service directly. Do **not** wrap trivial reads/writes behind `rpc`.

**Good**
```ts
await rpc.invoke('generateInvoice', { orderId }) // orchestrates multiple steps/rules
```

**Avoid**
```ts
await rpc.invoke('loadCard', { cardId }) // trivial; prefer services.store.getCard(cardId)
```

This keeps call graphs clear, prevents cycles, and reduces overhead.

---

## Directories & file rules

```
packages/functions/src/
  functions/*.function.ts     # domain functions only
  services/*.ts               # service classes/interfaces (Pikku‑agnostic by default)
  services.ts                 # service assembly (typed factories)
  errors.ts                   # project-specific errors (prefer importing core errors)
  permissions.ts              # PikkuPermission definitions
  middleware.ts               # PikkuMiddleware definitions
  config.ts                   # createConfig() implementation
```

**Functions** (`*.function.ts`)

- Allowed imports: local types, `pikkuFunc` / `pikkuFuncSessionless`, and error/permission/middleware symbols.
- No wiring/adapters/env/globals in these files.
- Private helpers allowed if **not exported**.

**Wiring**

- Wiring is a thin binding layer and imports adapter APIs **only** from `./pikku-types.gen.ts`.
- Wiring files live alongside code using a **suffix** per transport: `.http.ts`, `.channel.ts`, `.queue.ts`, `.schedule.ts`, `.mcp.ts`.
- Never import from `./services/**` in wiring. See `wiring/README.md` and per‑transport guides.

**Services**

- Services live in `services/**` and should be **Pikku‑agnostic by default** (rare, documented exceptions allowed for runtime handles).
- Service assembly happens only in `services.ts`. See `services.md` for detailed guidance.

---

## Permissions

A permission is a boolean‑returning guard with the same parameters as a Pikku function.

```ts
export const requireOwner: PikkuPermission<{ resourceOwnerId: string }> =
  async ({ ownership }, data, session) => {
    if (!session?.userId) return false
    return ownership.isOwner(session.userId, data.resourceOwnerId)
  }
```

Attach permissions to functions via the `permissions` property. Prefer function‑level permissions; use transport‑level overrides sparingly.

---

## Middleware

Middleware wraps a Pikku function before/after execution.

- Use cross‑transport middleware when needed, but keep it simple.
- Per‑transport middleware may be attached in wiring (e.g., HTTP cookie persistence after login, scheduler metrics).

Example (audit‑style):
```ts
export const audit: PikkuMiddleware = async ({ userSession, logger }, interaction, next) => {
  const t0 = Date.now()
  try {
    await next()
  } finally {
    const userId = await userSession.get('userId').catch(() => undefined)
    logger?.info?.('audit', { route: interaction.route, userId, ms: Date.now() - t0 })
  }
}
```

---

## userSession

- Set session attributes inside **any** protocol using the `userSession` service.
- Persistence is provided by transport middleware (e.g., HTTP cookies).
- Do not manually check for session presence in functions; rely on `auth` and permissions.

---

## EventHub (transport‑agnostic pub/sub)

Use **EventHub** for topic‑based fan‑out across channels, SSE, queues, or internal events.

- Typically **provided by the runtime/adapter** (uWS, AWS, etc.) and injected as a service.
- Use from functions; avoid importing services in wiring.

Typical channel usage:
```ts
await eventHub.subscribe(topic, channel.channelId)
await eventHub.unsubscribe(topic, channel.channelId)
await eventHub.publish(topic, null, payload)      // broadcast to all
await eventHub.publish(topic, channel.channelId, payload) // exclude/target (adapter dependent)
```

---

## Canonical function examples

**Read (exposed RPC)**
```ts
export const getCard = pikkuFunc<{ cardId: string }, Card>({
  expose: true,
  docs: { summary: 'Fetch a card', errors: ['NotFoundError'] },
  func: async ({ store }, { cardId }) => {
    const card = await store.getCard(cardId)
    if (!card) throw new NotFoundError('Card not found')
    return card
  },
})
```

**Mutation using RPC for orchestration**
```ts
export const closeAccount = pikkuFunc<{ accountId: string }, { closed: true }>({
  docs: { summary: 'Close an account', errors: ['ForbiddenError','ConflictError'] },
  func: async ({ rpc, audit, permissions }, { accountId }, session) => {
    await permissions.require('accounts.close', session)
    await rpc.invoke('beginAccountClosure', { accountId })
    await rpc.invoke('flushUserSessions', { accountId })
    await rpc.invoke('revokeKeysAndNotify', { accountId })
    await audit.log('account.closed', { accountId })
    return { closed: true }
  },
})
```

**Sessionless health**
```ts
export const health = pikkuFuncSessionless<void, { status: string}>({
  auth: false,
  expose: true,
  docs: { summary: 'Health check' },
  func: async () => ({ status: 'ok' }),
})
```

---

## Errors

- Throw subclasses of `PikkuError` with clear messages.
- Prefer importing core errors from `@pikku/core/errors`.
- Register mappings in one place. See `errors-and-mapping.md` for the registry, HTTP `status`, optional MCP `mcpCode`, and messages.
- Functions simply **throw**; adapters translate to transport responses.

---

## Required docs on every function

Every function includes a `docs` block:

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

- [ ] Files live under `packages/functions/src/` with correct suffixes.
- [ ] Functions are async and **destructure services**.
- [ ] No wiring/adapters/env/globals inside function files.
- [ ] `rpc.invoke` used **only** when non‑trivial reuse is intended.
- [ ] Services are Pikku‑agnostic by default and assembled in `services.ts`.
- [ ] Errors extend `PikkuError` and are registered in the central registry.
- [ ] Every function has a `docs` block.
- [ ] No `any` or `@ts-ignore` without justification.

---

## Code style

- Always use `async`/`await`; do not use `.then()`/`.catch()` for control flow.
- Use `try/catch` only when there is something meaningful to handle/log; otherwise let errors bubble.
