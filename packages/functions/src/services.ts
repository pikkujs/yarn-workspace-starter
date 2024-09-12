import { VrameworkSessionService } from '@vramework/core/services/vramework-session-service'
import { VrameworkJWTService } from '@vramework/core/services/vramework-jwt-service'
import { Config, SingletonServices, UserSession } from './api'
import { getDatabaseConfig, KyselyDB } from './kysely.service'
import { LocalSecretService } from '@vramework/core/services/local-secrets'
import { PinoLogger } from './pino.service'

export const createSingletonServices = async (config: Config): Promise<SingletonServices> => {
  const logger = new PinoLogger()

  if (config.logLevel) {
    logger.setLevel(config.logLevel)
  }

  const secrets = new LocalSecretService(logger)

  const jwt = new VrameworkJWTService<UserSession>(logger, async () => [{
    keyid: 'my-key',
    secret: 'the-yellow-puppet'
  }])
  
  const sessionService = new VrameworkSessionService(
    jwt,
    {}
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
