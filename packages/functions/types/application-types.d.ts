import type {
  CoreServices,
  CoreServerConfig,
  CoreSingletonServices,
  CoreUserSession,
  LogLevel
} from '@vramework/core'
import type { SQLConfig } from '@todos/functions/src/services/kysely'
import type { DB } from 'kysely-codegen'
import type { Kysely } from 'kysely'
import type { JoseJWTService } from '@vramework/jose'

export interface Config extends CoreServerConfig {
  logLevel: LogLevel
  sql: SQLConfig
  secrets: {
    postgresCredentials: string
  }
}

export type SingletonServices = CoreSingletonServices & {
  jwt: JoseJWTService<UserSession>
  kysely: Kysely<DB>
}

export interface Services extends CoreServices<SingletonServices> {
}

export interface UserSession extends CoreUserSession {
  userId: string
}
