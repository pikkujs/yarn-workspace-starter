import type { JustUserName, UpdateUser, Session } from '@vramework-workspace-starter/sdk/types/user.types.js'
import type { APIFunctionSessionless } from '../../../.vramework/vramework-types.js'
import type { UserSession } from '../../../types/application-types.js'

export const loginUser: APIFunctionSessionless<
  JustUserName,
  Session
> = async (services, { name }) => {
  let session: UserSession | undefined
  try {
    session = await services.kysely
      .selectFrom('app.user')
      .select('userId')
      .where('name', '=', name.toLowerCase())
      .executeTakeFirstOrThrow()
  } catch {
    session = await services.kysely
      .insertInto('app.user')
      .values({ name: name.toLowerCase() })
      .returning('userId')
      .executeTakeFirstOrThrow()
  }

  services.http?.response?.setCookie(
    'session',
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
  services.http?.response?.clearCookie('session')
}

export const updateUser: APIFunctionSessionless<UpdateUser, void> = async (
  services,
  { userId, ...data }
) => {
  await services.kysely
    .updateTable('app.user')
    .set(data)
    .where('userId', '=', userId)
    .executeTakeFirstOrThrow()
}

