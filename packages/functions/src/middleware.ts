import { APIMiddleware } from "#pikku/pikku-types.gen.js"
import { authCookieMiddleware, UnauthorizedError } from "@pikku/core"
import { addMiddleware } from "node_modules/@pikku/core/dist/http/http-route-runner.js"

export const headerAPIKeyMiddleware: APIMiddleware = async (services, { http }, next) => {
    const apiKey = http?.request?.getHeader('x-api-key')
    if (apiKey) {
        try {
            const session = await services.kysely
                .selectFrom('user')
                .select(['userId', 'apiKey'])
                .where('apiKey', '=', apiKey)
                .executeTakeFirstOrThrow()
            await services.userSessionService.set(session)
        } catch {
            throw new UnauthorizedError('Invalid API key in header')
        }
    }
    await next()
}

export const queryAPIKeyMiddleware: APIMiddleware = async (services, { http }, next) => {
    const apiKey = http?.request?.getQuery().apiKey as string
    if (apiKey) {
        try {
            const session = await services.kysely
                .selectFrom('user')
                .select(['userId', 'apiKey'])
                .where('apiKey', '=', apiKey)
                .executeTakeFirstOrThrow()
            await services.userSessionService.set(session)
        } catch {
            throw new UnauthorizedError('Invalid API key in header')
        }
    }
    await next()
}

const cookieMiddleware = () => {
    return authCookieMiddleware({ cookieNames: ['pikku'] })
}

addMiddleware('*', [cookieMiddleware, headerAPIKeyMiddleware, queryAPIKeyMiddleware])