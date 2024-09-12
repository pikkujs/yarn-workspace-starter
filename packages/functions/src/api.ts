import { CoreConfig, CoreSingletonServices, CoreUserSession } from '@vramework/core/types'
import { SQLConfig } from './kysely.service'
import { Kysely } from 'kysely'
import { DB } from 'kysely-codegen'

export interface Config extends CoreConfig {
  sql: SQLConfig,
  secrets: {
    postgresCredentials: string
  }
}

export type SingletonServices = CoreSingletonServices & {
  kysely: Kysely<DB>
}

export interface Services extends SingletonServices {

}

export interface UserSession extends CoreUserSession {

}

export const EMPTY = ''