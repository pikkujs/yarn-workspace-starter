import { type JustUserName, type UpdateUser } from '@todos/sdk/types/user.types'
import { APIFunctionSessionless } from '../vramework-types'
import { UserSession } from '../api'

export const loginUser: APIFunctionSessionless<
  JustUserName,
  UserSession
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

  services.response.setCookie(
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
  services.response.clearCookie('session')
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
