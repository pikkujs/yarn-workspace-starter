import { LogLevel } from '@vramework/core'
import { VrameworkConfig } from './api'

export const config: VrameworkConfig = {
  port: 4002,
  logLevel: LogLevel.info,
  secrets: {
    postgresCredentials: 'POSTGRES_CREDENTIALS',
  },
  sql: {
    directory: `${__dirname}/../../../sql`,
  },
}
