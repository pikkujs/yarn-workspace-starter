import { authAPIKey, authCookie, UnauthorizedError, addMiddleware, addHTTPMiddleware } from "@pikku/core"

export const apiKeyMiddleware = () => {
    return authAPIKey<any, any>({
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
    return authCookie(
        {
            name: 'pikku:session',
            jwt: true,
            expiresIn: { value: 4, unit: 'week' },
            options: { sameSite: 'lax', path: '/' },
        }
    )
}

addHTTPMiddleware([cookieMiddleware(), apiKeyMiddleware()])