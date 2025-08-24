# Project Structure

Defines a **minimal, predictable layout** so codegen, adapters, and agents can find everything without guesswork. This document avoids duplication and links to the single sources of truth where relevant.

## Goals
- Keep **domain logic** in `packages/functions/**` (transport‑agnostic).  
- Keep **wiring** thin and suffix‑based (see Wiring Overview).  
- Centralize **services assembly** and keep service files Pikku‑agnostic by default.  
- Make **generated files** explicit and disposable.  
- Support **monorepo workspaces** or single‑package layouts.

---

## Recommended layouts

### A) Monorepo (Yarn workspaces)
Top‑level separation for **backends**, **apps**, and **packages**. See the starter and example tree. 

```
backends/
  express/               # example runtime adapter host (optional)
    bin/
      start.ts
    package.json

apps/
  next-app/              # example web app

packages/
  functions/             # the app’s backend domain (source of truth)
    src/
      functions/         # *.function.ts only (no wiring/adapters)
      services/          # service classes/interfaces (no @pikku/* by default)
      config.ts          # createConfig() impl
      services.ts        # service assembly (typed factories)
      permissions.ts     # PikkuPermission definitions
      middleware.ts      # PikkuMiddleware definitions
      errors.ts          # project-specific errors (prefer @pikku/core/errors)
    .pikku/
      pikku-types.gen.ts # GENERATED adapter surface for wiring (do not edit)
    package.json

  sdk/                   # (optional) shared types/clients for apps
  services/              # (optional) infra packages (db, logger, etc.)

.pikku/
  pikku-services.gen.ts  # GENERATED singleton flags for tree-shaking

package.json
```
For a concrete example tree and notes on workspaces, see `yarn-workspaces.md`. fileciteturn5file4

### B) Single package (small projects)
```
src/
  functions/**           # domain functions (*.function.ts)
  services/**            # service implementations
  services.ts            # service assembly
  permissions.ts
  middleware.ts
  config.ts
  errors.ts
.pikku/pikku-services.gen.ts # GENERATED
.pikku/pikku-types.gen.ts # GENERATED
package.json
```

---

## File placement & naming rules

- **Domain functions** → `packages/functions/src/functions/**/*.function.ts`. No wiring/adapters/env. Follow `system.md` function rules. fileciteturn5file7
- **Wiring** (thin binding layer) lives **next to** functions under `packages/functions/src/**`, using **suffixes** only (no transport folders): `.http.ts`, `.channel.ts`, `.queue.ts`, `.schedule.ts`, `.mcp.ts`. See Wiring Overview for details. fileciteturn5file1
- **Never mix transports** in one file. Grouping multiple bindings is allowed only for the **same** transport and only if configured (`agent.filePerWire=false`). fileciteturn5file8
- **Services** → `services/**` (Pikku‑agnostic by default; rare, documented exceptions). **Assembly** only in `services.ts`. fileciteturn5file10
- **Errors** → reuse from `@pikku/core/errors` when possible; project‑specific errors live in `errors.ts`. Keep the **registry** in one place (see errors-and-mapping).  
- **Generated files** → `pikku-types.gen.ts`, `.pikku/pikku-services.gen.ts`. Never edit; regenerate from CLI.

---

## Wiring overview (quick linkouts)
- **HTTP** → `http.md` (route binding, per‑route/global middleware, SSE). fileciteturn5file16
- **Channel (Realtime)** → `channel.md` (connect/disconnect/message handlers, `services.channel`). fileciteturn5file6
- **Queue** → `queue.md` (worker binding, concurrency, visibility). fileciteturn5file14
- **Scheduler** → `scheduler.md` (cron binding, global/per‑schedule middleware). fileciteturn5file12
- **MCP** → `mcp.md` (resources/tools/prompts; return types). fileciteturn5file2

---

## Tests
- **Unit tests** sit next to the code under test (e.g., `functions/*.function.test.ts`, `services/*.test.ts`).  
- **Integration tests** construct services via `createSingletonServices(config, existing)` and wire minimal routes/tools as needed.  
- Avoid importing wiring in tests; test domain logic directly, and use wiring only for adapter behavior where necessary.

---

## PR / CI checklist (structure)
- [ ] All domain functions live under `functions/**/*.function.ts` and follow `system.md` rules. fileciteturn5file7
- [ ] Wiring files use the correct transport suffix and import **only** from `./pikku-types.gen.ts` plus exported functions/permissions/middleware. fileciteturn5file1
- [ ] No services imported in wiring; no business logic in wiring. fileciteturn5file1
- [ ] No mixed transports in a single file; grouping same-transport only when allowed. fileciteturn5file8
- [ ] `services/**` are Pikku‑agnostic by default; `services.ts` handles assembly; optional services are gated by `singletonServices['name']`. fileciteturn5file10
- [ ] Generated files are not edited by hand.
- [ ] Errors are defined or reused once and registered centrally (see errors-and-mapping).

---

## Notes for agents & codegen
- Treat `system.md` as the **source of truth** for function syntax, permissions, middleware, and RPC usage. Link to it rather than duplicating rules. fileciteturn5file7
- For wiring, rely on the generated surface in `pikku-types.gen.ts` and never import from `@pikku/core/*` inside wiring files. fileciteturn5file1
- When adding optional services, **always** gate with `singletonServices['serviceName']` before dynamic import/instantiation (keeps bundles small).

