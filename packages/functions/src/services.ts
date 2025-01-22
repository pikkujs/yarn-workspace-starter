import type {
  CreateSingletonServices,
  CreateSessionServices,
} from '@vramework/core'
import { VrameworkHTTPSessionService } from '@vramework/core/http'

import {
  ConsoleLogger,
  LocalSecretService,
  LocalVariablesService,
} from '@vramework/core/services'

import type {
  Config,
  Services,
  SingletonServices,
  UserSession,
} from './application-types.js'
import {
  getDatabaseConfig,
  KyselyDB,
} from '@vramework-workspace-starter/functions/src/services/kysely.js'
import { JoseJWTService } from '@vramework/jose'
import { UnauthorizedError } from '@vramework/core/errors'
import { AjvSchemaService } from '@vramework/schema-ajv'

export const createSingletonServices: CreateSingletonServices<
  Config,
  SingletonServices
> = async (
  config,
  { variablesService, secretsService, schemaService } = {}
) => {
  const logger = new ConsoleLogger()

  if (config.logLevel) {
    logger.setLevel(config.logLevel)
  }

  // This is passed in because different providers 
  // like CloudWatch and AWS have seperate ways
  // to access env variables
  if (!variablesService) {
    variablesService = new LocalVariablesService()
  }

  // This is passed in because different providers have 
  // different ways to access secrets
  if (!secretsService) {
    secretsService = new LocalSecretService(variablesService)
  }

  // Cloudflare Workers doesn't support ajv library
  if (!schemaService) {
    schemaService = new AjvSchemaService(logger)    
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

  // Get the connection
  const postgresConfig = await getDatabaseConfig(
    variablesService,
    secretsService,
    config.secrets.postgresCredentials,
    config.sql
  )

  const kyselyDB = new KyselyDB(postgresConfig, logger)
  await kyselyDB.init()

  const httpSessionService = new VrameworkHTTPSessionService(jwt, {
    cookieNames: ['todo-session'],
    getSessionForCookieValue: async (cookieValue: string) => {
      return await jwt.decodeSession(cookieValue)
    },
    getSessionForAPIKey: async (apiKey: string) => {
      try {
        return await kyselyDB.kysely
          .selectFrom('user')
          .select(['userId', 'apiKey'])
          .where('apiKey', '=', apiKey)
          .executeTakeFirstOrThrow()
      } catch {
        throw new UnauthorizedError('Invalid API key in header')
      }
    },
    getSessionForQueryValue: async (queryValues) => {
      const apiKey = queryValues.apiKey as string
      if (apiKey) {
        try {
          return await kyselyDB.kysely
            .selectFrom('user')
            .select(['userId', 'apiKey'])
            .where('apiKey', '=', apiKey)
            .executeTakeFirstOrThrow()
        } catch {
          throw new UnauthorizedError('Invalid API key in query')
        }
      }
    },
  })

  return {
    config,
    variablesService,
    secretsService,
    schemaService,
    logger,
    jwt,
    httpSessionService,
    kysely: kyselyDB.kysely,
  }
}

export const createSessionServices: CreateSessionServices<
  SingletonServices,
  Services,
  UserSession
> = async (_singletonServices, _session) => {
  return {}
}
