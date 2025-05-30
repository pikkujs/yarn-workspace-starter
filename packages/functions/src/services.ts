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
import './middleware.js'

export const createSingletonServices: CreateSingletonServices<
  Config,
  SingletonServices
> = async (
  config,
  { variables, secrets } = {}
) => {
  const logger = new ConsoleLogger()

  if (config.logLevel) {
    logger.setLevel(config.logLevel)
  }

  // This is passed in because different providers 
  // like CloudWatch and AWS have seperate ways
  // to access env variables
  if (!variables) {
    variables = new LocalVariablesService()
  }

  // This is passed in because different providers have 
  // different ways to access secrets
  if (!secrets) {
    secrets = new LocalSecretService(variables)
  }

  const schema = new CFWorkerSchemaService(logger)    

  const jwt = new JoseJWTService(
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
    variables,
    secrets,
    config.secrets.postgresCredentials,
    config.sql
  )

  const pikkuKysely = new PikkuKysely<KyselyDB.DB>(logger, postgresConfig, 'app')
  await pikkuKysely.init()
  const kysely = pikkuKysely.kysely

  return {
    config,
    variables,
    secrets,
    schema,
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
