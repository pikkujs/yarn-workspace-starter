```md
# MCP Wiring Guide

This file explains **how to wire Pikku MCP resources, tools, and prompts** using the generated adapter APIs in `./pikku-types.gen.ts`.

MCP wiring is a **thin binding layer** that:
- Registers exported MCP functions to the MCP runtime.
- Leaves all logic inside `packages/functions/src/functions/**/*.function.ts`.
- Never touches services directly from wiring.

---

## File naming

- MCP wiring files must end with `.mcp.ts`.
- Files can live anywhere under `packages/functions/src/`.
- You may group multiple **MCP bindings** (resources/tools/prompts) in a single file (**same transport only**).

Examples:
```

packages/functions/src/code-search.mcp.ts
packages/functions/src/agent-ops.mcp.ts

````

---

## Allowed imports in MCP wiring files

- `wireMCPResource`, `wireMCPTool`, `wireMCPPrompt` from `./pikku-types.gen.ts`
- Exported MCP functions from `./functions/**/*.function.ts`
- Optional `config` if you feature-gate MCP exposure

**Disallowed**
- Importing from `./services/**`
- Implementing business logic here
- Direct env/globals access

> Adapter APIs must come **only** from `./pikku-types.gen.ts`. Do **not** import `@pikku/core/*` in wiring.

---

## Return types (specify them explicitly)

From your generated/core types:

```ts
export type MCPPromptMessage = {
  role: 'user' | 'assistant' | 'system';
  content: { type: 'text' | 'image'; text: string; data?: string };
};
export type MCPPromptResponse  = MCPPromptMessage[];

export type MCPResourceMessage = { uri: string; text: string };
export type MCPResourceResponse = MCPResourceMessage[];

export type MCPToolMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string };
export type MCPToolResponse = MCPToolMessage[];
````

When defining MCP functions, **always** provide the output type:

* Resource: `pikkuMCPResourceFunc<In, MCPResourceResponse>(...)`
* Tool: `pikkuMCPToolFunc<In, MCPToolResponse>(...)`
* Prompt: `pikkuMCPPromptFunc<In, MCPPromptResponse>(...)`

Follow the global Code Style rule: **use `await` + `try/catch`**, never `.then/.catch`.

---

## Wiring examples

### Resource

```ts
// packages/functions/src/code-search.mcp.ts
import { wireMCPResource } from './pikku-types.gen.js'
import { codeSearch } from './functions/code-search.function.js'

wireMCPResource(codeSearch)
```

```ts
// packages/functions/src/functions/code-search.function.ts
import { pikkuMCPResourceFunc } from '@pikku/core'
import type { MCPResourceResponse } from '../pikku-types.gen.js'

type In = { query: string; limit?: number }

export const codeSearch = pikkuMCPResourceFunc<In, MCPResourceResponse>({
  func: async ({ rpc }, input) => {
    const results = await rpc.invoke('searchCode', { query: input.query, limit: input.limit ?? 20 })
    return [{ uri: 'pikku://code-search', text: JSON.stringify(results) }]
  },
})
```

### Tool

```ts
// packages/functions/src/code-ops.mcp.ts
import { wireMCPTool } from './pikku-types.gen.js'
import { annotateSelection } from './functions/code-ops.function.js'

wireMCPTool(annotateSelection)
```

```ts
// packages/functions/src/functions/code-ops.function.ts
import { pikkuMCPToolFunc } from '@pikku/core'
import type { MCPToolResponse } from '../pikku-types.gen.js'

type In = { file: string; line: number; note: string }

export const annotateSelection = pikkuMCPToolFunc<In, MCPToolResponse>({
  func: async ({ rpc }, input) => {
    await rpc.invoke('annotateFile', input)
    return [{ type: 'text', text: 'Annotation added' }]
  },
})
```

### Prompt

```ts
// packages/functions/src/review-prompt.mcp.ts
import { wireMCPPrompt } from './pikku-types.gen.js'
import { reviewPrompt } from './functions/review-prompt.function.js'

wireMCPPrompt(reviewPrompt)
```

```ts
// packages/functions/src/functions/review-prompt.function.ts
import { pikkuMCPPromptFunc } from '@pikku/core'
import type { MCPPromptResponse } from '../pikku-types.gen.js'

type In = { language: string }

export const reviewPrompt = pikkuMCPPromptFunc<In, MCPPromptResponse>({
  func: async (_services, input) => ([
    {
      role: 'user',
      content: { type: 'text', text: `Please review this ${input.language} code following Pikku rules.` }
    }
  ]),
})
```

---

## Grouping multiple MCP bindings in one file

```ts
// packages/functions/src/agent-ops.mcp.ts
import { wireMCPResource, wireMCPTool, wireMCPPrompt } from './pikku-types.gen.js'
import { codeSearch } from './functions/code-search.function.js'
import { annotateSelection } from './functions/code-ops.function.js'
import { reviewPrompt } from './functions/review-prompt.function.js'

wireMCPResource(codeSearch)
wireMCPTool(annotateSelection)
wireMCPPrompt(reviewPrompt)
```

> **Rule:** Do not mix transports. A `.mcp.ts` file may contain multiple MCP bindings, but no HTTP/Queue/Scheduler/Channel wirings.

---

## Error handling (include `mcpCode`)

* MCP functions should throw `PikkuError` subclasses for expected failures.
* Wiring does not catch/rewrite errors; the adapter will map them to MCP responses.
* Register errors with **HTTP status** and **MCP error codes** using `addError`:

```ts
/**
 * The server cannot find the requested route.
 * @group Error
 */
addError(NotFoundError, {
  status: 404,
  mcpCode: -32601, // MCP error code for "method not found"
  message: 'The server cannot find the requested resource.',
})
```

> Always provide **`mcpCode`** for errors reachable via MCP so clients can interpret failures correctly.

---

## PR/CI checklist for MCP wiring

* [ ] File ends with `.mcp.ts`.
* [ ] Adapter imports come **only** from `./pikku-types.gen.ts`.
* [ ] Imports limited to exported MCP functions (and optional config).
* [ ] No business logic or service imports in wiring.
* [ ] MCP function definitions specify the **output type** (`MCPResourceResponse`, `MCPToolResponse`, or `MCPPromptResponse`).
* [ ] Functions are `async`, destructure services, and are thin (prefer `rpc.invoke` for reuse).
* [ ] If grouping, only MCP bindings in the file (no mixed transports).
* [ ] Errors are registered with `addError` including `status` and **`mcpCode`**.