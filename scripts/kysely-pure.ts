import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const main = async () => {
  let kysely = await readFile(
    `${__dirname}/../node_modules/kysely-codegen/dist/db.d.ts`,
    'utf8'
  )
  kysely = kysely
    .replace(/import type { ColumnType } from "kysely";/, '')
    .replace(
      new RegExp('^export\\s+type\\s+Generated<[^>]+>.*?;\\s*$', 'ms'),
      ''
    )
    .replace(/Generated<(.*)>/g, '$1')
    .replace(/export type Timestamp =.*;/, 'export type Timestamp = Date')
  console.log('Writing kysely-pure.d.ts')
  await mkdir(`${__dirname}/../packages/sdk/generated`, { recursive: true })
  await writeFile(
    `${__dirname}/../packages/sdk/generated/db-pure.d.ts`,
    kysely,
    'utf-8'
  )
  console.log(`${__dirname}/../packages/sdk/generated/db-pure.d.ts`)
}

main()
