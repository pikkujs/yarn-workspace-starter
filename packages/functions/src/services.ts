import type {
  CreateSingletonServices,
  CreateSessionServices,
} from '@pikku/core'
import type { KyselyDB } from '@pikku-workspace-starter/sdk' 
import { PikkuKysely } from '@pikku/kysely'
import {
  ConsoleLogger,
  LocalSecretService,
  LocalVariablesService,
} from '@pikku/core/services'

import type {
  Config,
  Services,
  SingletonServices,
  UserSession,
} from './application-types.js'
import { JoseJWTService } from '@pikku/jose'
import { CFWorkerSchemaService } from '@pikku/schema-cfworker'
import { getDatabaseConfig } from './config.js'

export const createSingletonServices: CreateSingletonServices<
  Config,
  SingletonServices
> = async (
  config,
  { variablesService, secretService } = {}
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
  if (!secretService) {
    secretService = new LocalSecretService(variablesService)
  }

  const schemaService = new CFWorkerSchemaService(logger)    

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
    secretService,
    config.secrets.postgresCredentials,
    config.sql
  )

  const pikkuKysely = new PikkuKysely<KyselyDB.DB>(logger, postgresConfig, 'app')
  await pikkuKysely.init()
  const kysely = pikkuKysely.kysely

  return {
    config,
    variablesService,
    secretService,
    schemaService,
    logger,
    jwt,
    kysely,
  }
}

export const createSessionServices: CreateSessionServices<
  SingletonServices,
  Services,
  UserSession
> = async (_singletonServices, _session) => {
  return {}
}
