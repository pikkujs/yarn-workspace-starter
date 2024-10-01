
import { CreateSessionServices } from '@vramework/core'
import { LocalSecretService, VrameworkSessionService, JoseJWTService } from '@vramework/services-local'

import { Config, SingletonServices, UserSession } from './api'
import { getDatabaseConfig, KyselyDB } from '@todos/services/src/kysely'
import { PinoLogger } from '@todos/services/src/pino'

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