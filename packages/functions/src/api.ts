import type {
  CoreServerConfig,
  CoreSingletonServices,
  CoreUserSession,
  VrameworkRequest, 
  VrameworkResponse 
} from '@vramework/core'
import type { JoseJWTService } from '@vramework/services-local'
import type { SQLConfig } from '@todos/services/src/kysely'
import type { DB } from 'kysely-codegen'
import type { Kysely } from 'kysely'

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

export interface Services extends SingletonServices {
  request: VrameworkRequest
  response: VrameworkResponse
}

export interface UserSession extends CoreUserSession {
  userId: string
}

export const EMPTY = ''
