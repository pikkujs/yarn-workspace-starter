import pg from 'pg'
import { migrate } from 'postgres-migrations'
import { LocalSecretService } from '@vramework/core/services'

import { createConfig } from '@todos/functions/src/config.js'
import { getDatabaseConfig } from '@todos/functions/src/services/kysely.js'

import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const migrateDB = async () => {
  const config = await createConfig()
  const secrets = new LocalSecretService()
  const databaseConfig = await getDatabaseConfig(
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
      await client.query(`CREATE DATABASE ${databaseConfig.database}`)
    } catch {
      console.log('Database already exists')
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
