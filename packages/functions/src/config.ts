import { LogLevel } from '@vramework/core/services/logger'
import { Config } from './api'

export const config: Config = {
  port: 4002,
  logLevel: LogLevel.info,
  secrets: {
    postgresCredentials: 'POSTGRES_CREDENTIALS'
  },
  sql: {
    directory: `${__dirname}/../../../sql`
  }
}
