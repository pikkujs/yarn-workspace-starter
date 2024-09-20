import { LocalSecretService } from '@vramework/services-local/local-secrets'
import { VrameworkSessionService } from '@vramework/services-local/vramework-session-service'
import { JoseJWTService } from '@vramework/services-local/jose-jwt-service'

import { Config, SingletonServices, UserSession } from './api'
import { getDatabaseConfig, KyselyDB } from '@todos/services/src/kysely'
import { PinoLogger } from '@todos/services/src/pino'
import { CreateSessionServices } from '@vramework/core/types'

export const createSingletonServices = async (
  config: Config
): Promise<SingletonServices> => {
  const logger = new PinoLogger()

  if (config.logLevel) {
    logger.setLevel(config.logLevel)
  }

  const secrets = new LocalSecretService()

  const jwt = new JoseJWTService<UserSession>(
    async () => [
      {
        id: 'my-key',
        value: 'the-yellow-puppet',
      },
    ],
    logger
  )

  const sessionService = new VrameworkSessionService(jwt, {
    cookieNames: ['session'],
    getSessionForCookieValue: async (cookieValue: string) => {
      return await jwt.decodeSession(cookieValue)
    },
    getSessionForAPIKey: async (_apiKey: string) => {
      throw new Error('Not implemented')
    },
  })

  const postgresConfig = await getDatabaseConfig(
    secrets,
    config.secrets.postgresCredentials,
    config.sql
  )
  const { kysely } = new KyselyDB(postgresConfig)

  return {
    config,
    logger,
    jwt,
    sessionService,
    kysely,
  }
}

export const createSessionServices: CreateSessionServices = async (
  singletonServices,
  _session
) => {
  return {
    ...singletonServices,
  }
}