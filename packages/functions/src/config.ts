import { CreateConfig } from '@vramework/core'
import { LogLevel } from '@vramework/core/services'
import { Config } from './application-types.js'

export const createConfig: CreateConfig<Config> = async () => ({
  awsRegion: 'us-east-1',
  port: 4002,
  hostname: '0.0.0.0',
  logLevel: LogLevel.info,
  secrets: {
    postgresCredentials: 'POSTGRES_CREDENTIALS',
  },
  sql: {
    // ssl: variablesService.get('NODE_ENV') === 'production' ? {
    //   rejectUnauthorized: true,
    //   ca: globalBundlePem
    // } : undefined
  },
  apiKeys: ['top-secret-api-key'],
})
