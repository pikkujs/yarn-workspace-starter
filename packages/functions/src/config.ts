import { CreateConfig } from '@pikku/core'
import { LogLevel } from '@pikku/core/services'
import { Config } from './application-types.js'

import type {
  SecretService,
  VariablesService,
} from '@pikku/core/services'

export interface SQLConfig {
  ssl?: {
    rejectUnauthorized: boolean
    ca: string
  }
}

export const getDatabaseConfig = async (
  variablesService: VariablesService,
  secrets: SecretService,
  postgresSecret: string,
  sqlConfig: SQLConfig
) => {
  if (variablesService.get('NODE_ENV') === 'production') {
    const config = await secrets.getSecretJSON<any>(postgresSecret)
    return {
      ...config,
      ssl: sqlConfig.ssl,
      user: config.username || config.user,
      database: config.database || config.dbname,
    }
  } else {
    return {
      host: '0.0.0.0',
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'pikku_workspace_starter',
    }
  }
}


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
