import { CreateConfig } from '@vramework/core'
import { LogLevel } from '@vramework/core/services'
import { Config } from '../types/application-types'

export const createConfig: CreateConfig<Config> = async () => ({
  port: 4002,
  hostname: '0.0.0.0',
  logLevel: LogLevel.info,
  secrets: {
    postgresCredentials: 'POSTGRES_CREDENTIALS',
  },
  sql: {
    directory: `${__dirname}/../../../sql`,
  },
})
