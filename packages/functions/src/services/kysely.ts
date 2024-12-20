import type { Logger, SecretService } from '@vramework/core/services'
import { CamelCasePlugin, Kysely } from 'kysely'
import { DB } from 'kysely-codegen'
import { PostgresJSDialect } from 'kysely-postgres-js'
import postgres from 'postgres'

export interface SQLConfig {
  directory: string
  ssl?: {
    rejectUnauthorized: boolean
    ca: string
  }
}

export class KyselyDB {
  public kysely: Kysely<DB>
  private postgres: postgres.Sql<{}>

  constructor(poolConfig: any, private logger: Logger) {
    this.postgres = postgres(poolConfig)
    this.kysely = new Kysely<DB>({
      dialect: new PostgresJSDialect({
        postgres: this.postgres
      }),
      plugins: [new CamelCasePlugin()],
    })
  }

  public async init() {
    const response = await this.postgres`SELECT version();`
    this.logger.info(response[0].version)
  }
}

export const getDatabaseConfig = async (
  secrets: SecretService,
  postgresSecret: string,
  sqlConfig: SQLConfig
) => {
  if (process.env.NODE_ENV === 'production') {
    const config = await secrets.getSecretJSON<any>(postgresSecret)
    return {
      ...config,
      ssl: sqlConfig.ssl,
      user: config.username,
      database: config.database || config.dbname,
    }
  } else {
    return {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: 'vramework-workspace-starter',
    }
  }
}

