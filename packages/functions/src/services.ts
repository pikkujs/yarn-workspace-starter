import { VrameworkSessionService } from '@vramework/core/services/vramework-session-service'
import { JoseJWTService } from '@vramework/core/services/jose-jwt-service'
import { Config, SingletonServices, UserSession } from './api'
import { getDatabaseConfig, KyselyDB } from './services/kysely.service'
import { LocalSecretService } from '@vramework/core/services/local-secrets'
import { PinoLogger } from './services/pino.service'

export const createSingletonServices = async (config: Config): Promise<SingletonServices> => {
  const logger = new PinoLogger()

  if (config.logLevel) {
    logger.setLevel(config.logLevel)
  }

  const secrets = new LocalSecretService(logger)

  const jwt = new JoseJWTService<UserSession>(async () => [{
    id: 'my-key',
    value: 'the-yellow-puppet'
  }], logger)
  
  const sessionService = new VrameworkSessionService(
    jwt,
    {
      cookieNames: ['session'],
      getSessionForCookieValue: async (cookieValue: string) => {
        return await jwt.decodeSession(cookieValue)
      },
      getSessionForAPIKey: async (apiKey: string) => {
        throw new Error('Not implemented')
      }
    }
  )

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
