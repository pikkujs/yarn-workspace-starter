import { readFileSync } from 'fs'

import { LogLevel } from '@vramework/core/services/logger'
import { Config } from './api'

export const config: Config = {
  port: 4002,
  logLevel: LogLevel.info,
  secrets: {
    postgresCredentials: 'POSTGRES_CREDENTIALS'
  },
  sql: {
    directory: `${__dirname}/../../../sql`,
    ...process.env.NODE_ENV === 'production' ? {
      ssl: {
        rejectUnauthorized: false,
        ca: readFileSync(`${__dirname}/../config/global-bundle.pem`).toString(),
      }
    } : {}
  }
}
