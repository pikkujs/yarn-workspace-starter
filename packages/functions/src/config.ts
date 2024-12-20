import { CreateConfig } from '@vramework/core'
import { LogLevel } from '@vramework/core/services'
import { Config } from '../types/application-types.js'
import { dirname } from 'path'  
import { fileURLToPath } from 'url'
import { globalBundlePem } from '../config/global-bundle.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const createConfig: CreateConfig<Config> = async () => ({
  awsRegion: 'us-east-1',
  port: 4002,
  hostname: '0.0.0.0',
  logLevel: LogLevel.info,
  secrets: {
    postgresCredentials: 'vramework_workspace_starter_db',
  },
  sql: {
    directory: `${__dirname}/../../../sql`,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      ca: globalBundlePem
    } : undefined
  },
})
