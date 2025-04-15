import { authAPIKey, authCookie, UnauthorizedError, addMiddleware } from "@pikku/core"
import { SingletonServices, UserSession } from "./application-types.js"

export const apiKeyMiddleware = () => {
    return authAPIKey<SingletonServices, UserSession>({
        source: 'all',
        getSessionForAPIKey: async (services, apiKey) => {
            return services.kysely
                .selectFrom('user')
                .select(['userId', 'apiKey'])
                .where('apiKey', '=', apiKey)
                .executeTakeFirstOrThrow(() => new UnauthorizedError('Invalid API key in header'))
        }
    })
}

export const cookieMiddleware = () => {
    return authCookie<SingletonServices, UserSession>(
        {
            name: 'pikku:session',
            jwt: true,
            expiresIn: { value: 4, unit: 'week' },
            options: { sameSite: 'lax', path: '/' },
        }
    )
}

addMiddleware([cookieMiddleware(), apiKeyMiddleware()])