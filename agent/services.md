# Services Guide

This document explains how to **design, assemble, and use services** in a Pikku codebase. Services encapsulate infrastructure and stateful dependencies (DB, cache, JWT, schema, secrets, etc.) and are injected into functions via typed factories.

## Goals
- Keep domain functions pure and framework‑agnostic.
- Centralize infra concerns in services and a single services assembly.
- Enable tree‑shaking and small bundles by constructing only required services.

## Where services live
```
packages/functions/src/
  services/*.ts         # service classes/interfaces (avoid @pikku/*; see exception note)
  services.ts           # assembly: createSingletonServices / createSessionServices
  application-types.ts  # Config, Services, SingletonServices, UserSession
```
**Note:** Functions receive services via injection; wiring files must not import services.

## Lifetimes
- **Singleton services** — built once per process/worker and reused.
- **Session services** — built per interaction (per function invocation). Keep lightweight.

Channel-aware functions may also receive an adapter-provided channel handle via `services.channel`. That handle is separate from user‑defined services.

## Assembly API (signatures)
`services.ts` must export two factories:
```ts
export const createSingletonServices: CreateSingletonServices<Config, SingletonServices>
export const createSessionServices:   CreateSessionServices<SingletonServices, Services, UserSession>
```
Both factories are async and deterministic. `createSingletonServices` may hydrate partially provided services (useful in tests).

## Service source code rules
- **Default:** Service files in `services/**` are framework‑agnostic and avoid `@pikku/*` imports.
- **Exception (rare):** If a service must interact with a Pikku runtime concept (e.g., an adapter‑provided EventHub handle), document the reason at the top of the file and keep the surface minimal. Wiring still must not import from `services/**`.

Prefer classes/interfaces with clear contracts and avoid reading env/globals inside functions—expose them via services.

### Minimal example
```ts
// services/store.ts
export interface Store {
  getCard(id: string): Promise<Card | undefined> | Card | undefined
  setCard(card: Card): Promise<void> | void
}

export class InMemoryStore implements Store {
  private cards = new Map<string, Card>()
  getCard(id: string) { return this.cards.get(id) }
  setCard(card: Card) { this.cards.set(card.id, card) }
}
```

## RPC usage guidelines (IMPORTANT)
**`rpc.invoke()` is not a replacement for direct service calls.** Use it **only** when reusing a richer domain function that encapsulates multiple steps or concerns. Otherwise, call the relevant service directly.

**Use `rpc.invoke()` when the callee function provides things like:**
- Complex orchestration (multiple services, side‑effects, fan‑out)
- Transaction handling / idempotency
- Cross‑resource invariants or permission checks beyond the caller’s context
- Reusable validation/business rules that must stay centralized
- Long‑running workflows, retries, or saga‑like behavior

**Do _not_ use `rpc.invoke()` for:**
- Simple CRUD that the current function can do directly via a service
- Thin pass‑throughs / one‑liners that duplicate logic
- Anything that would create cycles or unnecessary coupling

> Rule of thumb: If the target is a trivial read/write on a single service, call the service directly. Reserve `rpc` for higher‑level domain functions.

## Example services assembly
A compact assembly showing: logger, variables, secrets, schema, jwt, a secret‑backed signer, and optional feature services **gated by generator flags** to keep bundles small. **Optional services MUST be guarded with `singletonServices['serviceName']` and only then imported/constructed.**

```ts
// packages/functions/src/services.ts
import type { CreateSingletonServices, CreateSessionServices } from '@pikku/core'
import type { Config, Services, SingletonServices, UserSession } from './application-types.d.js'
import { singletonServices } from '../.pikku/pikku-services.gen.js'

// Local, framework-agnostic core service implementations
import { ConsoleLogger } from './services/logger.js'
import { LocalVariablesService } from './services/variables.js'
import { LocalSecretService } from './services/secrets.js'
import { CFWorkerSchemaService } from './services/schema.js'
import { JoseJWTService } from './services/jwt.js'

export const createSingletonServices: CreateSingletonServices<Config, SingletonServices> = async (
  config,
  { variables, secrets } = {}
) => {
  const logger = new ConsoleLogger()
  if (config.logLevel) logger.setLevel(config.logLevel)

  if (!variables) variables = new LocalVariablesService()
  if (!secrets)   secrets   = new LocalSecretService(variables)

  const schema = new CFWorkerSchemaService(logger)

  const jwt = new JoseJWTService(
    async () => [{ id: 'my-key', value: 'the-yellow-puppet' }],
    logger
  )

  // Optional feature service — guard + dynamic import
  let pushNotifier: unknown | undefined
  if (singletonServices['pushNotifier']) {
    const { PushNotifier } = await import('./services/push-notifier.js')
    pushNotifier = new PushNotifier(logger)
  }

  // Secret-backed optional service — guard + dynamic import
  let webhookSigner: unknown | undefined
  if (singletonServices['webhookSigner']) {
    const signingKey = await secrets.getSecret(config.secrets.webhookSigningKey)
    const { WebhookSigner } = await import('./services/webhook-signer.js')
    webhookSigner = new WebhookSigner(signingKey)
  }

  return {
    config,
    variables,
    secrets,
    schema,
    logger,
    jwt,
    pushNotifier,
    webhookSigner,
  } as unknown as SingletonServices
}

// Session services: build light, per interaction
export const createSessionServices: CreateSessionServices<SingletonServices, Services, UserSession> = async (
  _singleton,
  _interaction,
  _session
) => {
  return {} as Services
}
```

## Using services in functions
Domain functions receive services as the first parameter. **ALWAYS destructure services directly in the function parameter list**, never inside the function body.

**Correct (services destructured in parameter list):**
```ts
import { pikkuFunc } from '#pikku/pikku-types.gen.js'

export const getCard = pikkuFunc<{ cardId: string }, Card>({
  docs: { summary: 'Fetch a card', description: 'Returns a card by ID', tags: ['cards'], errors: ['NotFoundError'] },
  func: async ({ store, logger }, { cardId }) => { // ✅ CORRECT: Services destructured here
    const card = await store.getCard(cardId)
    if (!card) throw new NotFoundError('Card not found')
    logger.info('cards.get', { cardId })
    return card
  },
})
```

**WRONG (services destructured inside function body):**
```ts
export const getCard = pikkuFunc<{ cardId: string }, Card>({
  docs: { summary: 'Fetch a card', errors: ['NotFoundError'] },
  func: async (services, { cardId }) => { // ❌ WRONG: services not destructured
    const { store, logger } = services // ❌ WRONG: destructuring inside function body
    // ... rest of function
  },
})
```

**When to use `rpc.invoke()` (non‑trivial reuse):**
```ts
export const closeAccount = pikkuFunc<{ accountId: string }, { closed: true}>({
  docs: { summary: 'Close an account', tags: ['accounts'], errors: ['ForbiddenError','ConflictError'] },
  func: async ({ rpc, audit, permissions }, { accountId }, session) => {
    await permissions.require('accounts.close', session)
    // Orchestrates multiple steps across services and functions:
    await rpc.invoke('beginAccountClosure', { accountId })
    await rpc.invoke('flushUserSessions', { accountId })
    await rpc.invoke('revokeKeysAndNotify', { accountId })
    await audit.log('account.closed', { accountId })
    return { closed: true }
  },
})
```

## EventHub note
In most deployments, **EventHub** is provided by the runtime/adapter (uWS, AWS, etc.) and injected via services for use in functions (and SSE). Keep the interface in system docs if helpful, but avoid implementing heavy brokers in `services/**` unless targeting a specific runtime.

## Testing services
- Unit test service classes in isolation.
- Integration test functions by passing hydrated `existing` objects into `createSingletonServices` and/or by stubbing session services.
- Prefer stubbing services over mocking function internals.

## Anti‑patterns
- **CRITICAL**: Destructuring services inside function body instead of parameter list: `(services, data) => { const { kysely } = services }`
- Importing services inside **wiring** (HTTP/Channel/Queue/Scheduler/MCP). Wiring must remain adapter‑only.
- Reading environment variables directly inside functions; use `variables`/`secrets` services.
- Returning error objects instead of throwing domain/Pikku errors.
- Mixing `.then/.catch` with `async/await` style.
- Calling trivial functions via `rpc.invoke()` when a service call suffices.

## PR / CI checklist
- [ ] **CRITICAL**: Services are destructured in function parameter list, never inside function body: `({ kysely }, data) =>` NOT `(services, data) => { const { kysely } = services }`
- [ ] Optional services **MUST** be gated with `singletonServices['serviceName']` and dynamically imported **inside** the guard.
- [ ] `rpc.invoke()` is used **only** for non‑trivial, reusable domain functions; simple CRUD uses services directly.
- [ ] `services/**` is framework‑agnostic by default; any `@pikku/*` usage is documented and minimal.
- [ ] `services.ts` exports async `createSingletonServices` and `createSessionServices` with correct generics.
- [ ] No service imports in wiring; wiring uses only generated adapter APIs.
- [ ] Functions include `docs` and destructure services.
