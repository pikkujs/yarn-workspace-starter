import { Client } from 'pg'
import { migrate } from 'postgres-migrations'

import { config } from '@todos/functions/src/config'

import { ConsoleLogger } from '@vramework/core/services'
import { LocalSecretService } from '@vramework/services-local'
import { getDatabaseConfig } from '@todos/functions/src/services/kysely.service'

export const migrateDB = async () => {
  const logger = new ConsoleLogger()

  const secrets = new LocalSecretService(logger)
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
