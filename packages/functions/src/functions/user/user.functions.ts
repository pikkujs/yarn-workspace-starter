import { DB } from '@vramework-workspace-starter/sdk'
import type { APIFunctionSessionless } from '#vramework/vramework-types.gen.js'
import type { UserSession } from '@vramework-workspace-starter/functions/src/application-types.js'

export const loginUser: APIFunctionSessionless<
  Pick<DB.User, 'name'>,
  UserSession
> = async (services, { name }) => {
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

  services.http?.response?.setCookie(
    'todo-session',
    await services.jwt.encode('1w', session),
    { httpOnly: true }
  )

  return session
}

export const logoutUser: APIFunctionSessionless<void, void> = async (
  services,
  _data,
  _session
) => {
  services.http?.response?.clearCookie('todo-session')
}

export const updateUser: APIFunctionSessionless<Pick<DB.User, 'userId' | 'name'>, void> = async (
  services,
  { userId, ...data }
) => {
  await services.kysely
    .updateTable('user')
    .set(data)
    .where('userId', '=', userId)
    .executeTakeFirstOrThrow()
}
