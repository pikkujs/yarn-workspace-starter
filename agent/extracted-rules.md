# AGENT RULES VALIDATION

## ⚠️ CRITICAL RULES (MUST NEVER BE VIOLATED)

1. **No manual "is user authenticated?" checks; rely on `auth` (default `true`) and `permissions`/middleware**
   - Use `pikkuFunc` (authenticated by default) instead of `pikkuSessionlessFunc` with manual session checks
   - Source: agent/system.md:36

2. **Always destructure services in the function parameter list, never inside the function body**
   - ✅ Correct: `func: async ({ kysely, eventHub }, data) => { ... }`
   - ❌ Wrong: `func: async (services, data) => { const { kysely } = services ... }`
   - Source: agent/system.md:33

3. **Always import `pikkuFunc` and `pikkuFuncSessionless` from `#pikku/pikku-types.gen.js`, never from `@pikku/core`**
   - Source: agent/system.md:40

4. **Always use camelCase in TypeScript types and Kysely queries**
   - Kysely automatically converts snake_case database columns to camelCase
   - Source: agent/kysely.md:95

5. **Always import database types directly from generated files, never through re-exports**
   - ✅ Correct: `import type { Order } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.js'`
   - ❌ Wrong: `import type { Order } from '../../application-types.d.js'`
   - Source: agent/kysely.md:96

6. **Joined queries use proper typing pattern: `BaseType & { related: Pick<RelatedType, 'field1' | 'field2'> }`**
   - Source: agent/kysely.md:578

7. **Cross‑function calls must go through `rpc.invoke('<ExactExportName>', input)` — never import another Pikku function directly**
   - Source: agent/system.md:38

8. **Non-database types (DTOs) live in `function-types.ts` (not in `application-types.d.ts`)**
   - Source: agent/kysely.md:577

9. **Use single update with NotFoundError instead of read-then-update**
   - Atomic operations prevent race conditions and reduce queries
   - Source: agent/kysely.md:500

10. **Use `.returningAll()` instead of manually listing all columns when returning full entities**
    - Cleaner code and less maintenance when schema changes
    - Source: agent/kysely.md:546

## VALIDATION CHECKLIST

Before generating or modifying any code, validate against these rules:

- [ ] No manual auth checks - use `pikkuFunc` instead of `pikkuSessionlessFunc` with session checks
- [ ] Services destructured in parameter list: `({ kysely }, data)` NOT `(services, data) => { const { kysely } = services }`
- [ ] Import `pikkuFunc` from `#pikku/pikku-types.gen.js`, never from `@pikku/core`
- [ ] All TypeScript types and Kysely queries use camelCase (not snake_case)
- [ ] Database types imported directly from `@pikku-workspace-starter/sdk/.generated/database-types-pure.js`
- [ ] Non-database types (DTOs) live in `function-types.ts`
- [ ] Joined queries use pattern: `BaseType & { related: Pick<RelatedType, 'field1' | 'field2'> }`
- [ ] Cross-function calls use `rpc.invoke()`, never direct imports
- [ ] All HTTP route parameters use camelCase (`:orderId` not `:order_id`)
- [ ] Use single update with NotFoundError instead of read-then-update patterns
- [ ] Use `.returningAll()` instead of manually listing all columns for full entities