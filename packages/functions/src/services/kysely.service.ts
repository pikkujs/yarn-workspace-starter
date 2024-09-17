import { SecretService } from '@vramework/core/services'
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import { DB } from 'kysely-codegen'
import { Pool, PoolConfig } from 'pg'

export interface SQLConfig {
    directory: string
    ssl?: {
        rejectUnauthorized: boolean
        ca: string
    }
}

export class KyselyDB {
    public kysely: Kysely<DB>
    public pool: Pool

    constructor(config: PoolConfig) {
        this.pool = new Pool(config)
        this.kysely = new Kysely<DB>({
            dialect: new PostgresDialect({
                pool: this.pool
            }),
            plugins: [
                new CamelCasePlugin()
            ]
        })
    }
}

export const getDatabaseConfig = async (
    secrets: SecretService,
    postgresSecret: string,
    sqlConfig: SQLConfig
) => {
    if (process.env.NODE_ENV === 'production') {
        const config = await secrets.getSecret(postgresSecret)
        return {
            config,
            ssl: sqlConfig.ssl
        }
    } else {
        return {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'password',
            database: 'todos'
        }
    }
}