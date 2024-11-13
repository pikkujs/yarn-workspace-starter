import { Client } from 'pg'
import { migrate } from 'postgres-migrations'
import { LocalSecretService } from '@vramework/core'

import { createConfig } from '@todos/functions/src/config'
import { getDatabaseConfig } from '@todos/functions/src/services/kysely'

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
    const client = new Client({
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

  const client = new Client({
    ...databaseConfig,
    ssl: config.sql.ssl,
  })
  await client.connect()
  await migrate({ client }, `${__dirname}/../sql`, { logger: undefined })
  await client.end()
}

migrateDB()
