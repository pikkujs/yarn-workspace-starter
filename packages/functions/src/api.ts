import {
  CoreConfig,
  CoreSingletonServices,
  CoreUserSession,
} from '@vramework/core'
import { SQLConfig } from '@todos/services/src/kysely'
import { Kysely } from 'kysely'
import { DB } from 'kysely-codegen'
import { VrameworkRequest } from '@vramework/core/vramework-request'
import { VrameworkResponse } from '@vramework/core/vramework-response'
import { JoseJWTService } from '@vramework/services-local'

export interface Config extends CoreConfig {
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
