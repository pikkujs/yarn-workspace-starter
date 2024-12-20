import type { CreateSingletonServices, CreateSessionServices } from '@vramework/core'
import { VrameworkHTTPSessionService } from '@vramework/core/http'
import { ConsoleLogger, LocalSecretService  } from '@vramework/core/services'

import type { Config, Services, SingletonServices, UserSession } from '../types/application-types.js'
import { getDatabaseConfig, KyselyDB } from '@vramework-workspace-starter/functions/src/services/kysely.js'
import { JoseJWTService } from '@vramework/jose'
import { AWSSecrets } from '@vramework/aws-services/secrets'

const isProd = process.env.NODE_ENV === 'production'

export const createSingletonServices: CreateSingletonServices<Config, SingletonServices> = async (config) => {
  const logger = new ConsoleLogger()

  if (config.logLevel) {
    logger.setLevel(config.logLevel)
  }

  let secrets = new LocalSecretService()
  if (isProd) {
    secrets = new AWSSecrets(config)
  }

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
    getSessionForQueryValue: async (queryValue) => {
      throw new Error('Not implemented')
    }
  })

  const postgresConfig = await getDatabaseConfig(
    secrets,
    config.secrets.postgresCredentials,
    config.sql
  )
  const kyselyDB = new KyselyDB(postgresConfig, logger)
  await kyselyDB.init()

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