import type {
  CoreServices,
  CoreServerConfig,
  CoreSingletonServices,
  CoreUserSession,
} from '@vramework/core'
import type { SQLConfig } from '@todos/services/src/kysely'
import type { DB } from 'kysely-codegen'
import type { Kysely } from 'kysely'
import type { JoseJWTService } from '@vramework/jose'

export interface Config extends CoreServerConfig {
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
