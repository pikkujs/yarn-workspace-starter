
import { CreateSingletonServices, CreateSessionServices, LocalSecretService, VrameworkHTTPSessionService } from '@vramework/core'

import { Config, Services, SingletonServices, UserSession } from '../types/application-types'
import { getDatabaseConfig, KyselyDB } from '@todos/functions/src/services/kysely'
import { PinoLogger } from '@vramework/pino'
import { JoseJWTService } from '@vramework/jose'

export const createSingletonServices: CreateSingletonServices<Config, SingletonServices> = async (config) => {
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

  const sessionService = new VrameworkHTTPSessionService(jwt, {
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
  const kyselyDB = new KyselyDB(postgresConfig, logger)
  // await kyselyDB.init()

  return {
    config,
    logger,
    jwt,
    sessionService,
    kysely: kyselyDB.kysely,
  }
}

export const createSessionServices: CreateSessionServices<SingletonServices, UserSession, Services> = async (
  _singletonServices,
  _session
) => {
  return {
  }
}