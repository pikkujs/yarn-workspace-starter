import pg from 'pg'
import { migrate } from 'postgres-migrations'
import {
  LocalSecretService,
  LocalVariablesService,
  SecretService,
} from '@vramework/core/services'

import { createConfig } from '@vramework-workspace-starter/functions/src/config.js'
import { getDatabaseConfig } from '@vramework-workspace-starter/functions/src/services/kysely.js'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { AWSSecrets } from '@vramework/aws-services/secrets'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const migrateDB = async () => {
  const config = await createConfig()

  let secrets: SecretService
  if (process.env.NODE_ENV === 'production') {
    secrets = new AWSSecrets(config)
  } else {
    secrets = new LocalSecretService()
  }

  const databaseConfig = await getDatabaseConfig(
    new LocalVariablesService(),
    secrets,
    config.secrets.postgresCredentials,
    config.sql
  )

  // Create the database if it doesn't exist
  {
    const client = new pg.Client({
      ...databaseConfig,
      database: 'postgres',
      ssl: config.sql.ssl,
    })
    try {
      await client.connect()
      try {
        await client.query(`CREATE DATABASE "${databaseConfig.database}"`)
      } catch (e) {
        console.log('Database already exists')
      }
    } catch (e) {
      console.log(e)
    } finally {
      await client.end()
    }
  }

  const client = new pg.Client({
    ...databaseConfig,
    ssl: config.sql.ssl,
  })
  await client.connect()
  await migrate({ client }, `${__dirname}/../sql`, { logger: undefined })
  await client.end()
}

migrateDB()
