import { DB } from '@pikku-workspace-starter/sdk'
import type { UserSession } from '../../application-types.js'
import { pikkuSessionlessFunc } from '#pikku/pikku-types.gen.js'

export const loginUser = pikkuSessionlessFunc<
  Pick<DB.User, 'name'>,
  UserSession
>(async (services, { name }) => {
  let session: UserSession | undefined
  try {
    session = await services.kysely
      .selectFrom('user')
      .select(['userId', 'apiKey'])
      .where('name', '=', name.toLowerCase())
      .executeTakeFirstOrThrow()
  } catch {
    session = await services.kysely
      .insertInto('user')
      .values({ name: name.toLowerCase() })
      .returning(['userId', 'apiKey'])
      .executeTakeFirstOrThrow()
  }
  
  services.userSession?.set(session)

  return session!
})

export const logoutUser = pikkuSessionlessFunc<void, void>(async (
  services,
  _data,
  _session
) => {
  services.userSession?.clear()
})

export const updateUser = pikkuSessionlessFunc<Pick<DB.User, 'userId' | 'name'>, void>(async (
  services,
  { userId, ...data }
) => {
  await services.kysely
    .updateTable('user')
    .set(data)
    .where('userId', '=', userId)
    .executeTakeFirstOrThrow()
})
