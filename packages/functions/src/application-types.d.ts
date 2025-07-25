import type {
  CoreServices,
  CoreServerConfig,
  CoreSingletonServices,
  CoreUserSession,
  LogLevel,
  SecretService
} from '@pikku/core'
import type { Kysely } from 'kysely'
import type { KyselyDB } from '@pikku-workspace-starter/sdk'
import type { JoseJWTService } from '@pikku/jose'
import { SQLConfig } from './config.js'

export interface UserSession extends CoreUserSession {
  userId: string
}

export interface Config extends CoreServerConfig {
  awsRegion: string
  port: number
  hostname: string
  logLevel: LogLevel
  sql: SQLConfig
  secrets: {
    postgresCredentials: string
  }
  apiKeys: string[]
}

export interface SingletonServices extends CoreSingletonServices<Config> {
  jwt: JoseJWTService
  kysely: Kysely<KyselyDB.DB>
  subscriptionService?: SubscriptionService
  secrets: SecretService
  eventHub?: EventHubService
}

export interface Services extends CoreServices<SingletonServices, UserSession> {
  
}
