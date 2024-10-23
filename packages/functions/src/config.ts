import { LogLevel } from '@vramework/core'
import { Config } from '../types/application-types'

export const config: Config = {
  port: 4002,
  hostname: '0.0.0.0',
  logLevel: LogLevel.info,
  secrets: {
    postgresCredentials: 'POSTGRES_CREDENTIALS',
  },
  sql: {
    directory: `${__dirname}/../../../sql`,
  },
}
