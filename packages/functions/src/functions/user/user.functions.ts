import type { UserSession, UserRole } from '../../application-types.d.js'
import { pikkuSessionlessFunc } from '#pikku/pikku-types.gen.js'

export const loginUser = pikkuSessionlessFunc<
  { name: string; role?: UserRole },
  UserSession
>({
  func: async ({ kysely, userSession }, { name, role = 'client' }) => {
  let user: { userId: string; apiKey: string; role: UserRole } | undefined
  try {
    const existingUser = await kysely
      .selectFrom('user')
      .select(['userId', 'apiKey', 'role'])
      .where('name', '=', name.toLowerCase())
      .executeTakeFirstOrThrow()
    user = {
      userId: existingUser.userId,
      apiKey: existingUser.apiKey,
      role: existingUser.role as UserRole
    }
  } catch {
    const newUser = await kysely
      .insertInto('user')
      .values({ name: name.toLowerCase(), role })
      .returning(['userId', 'apiKey', 'role'])
      .executeTakeFirstOrThrow()
    user = {
      userId: newUser.userId,
      apiKey: newUser.apiKey,
      role: newUser.role as UserRole
    }
  }
  
  const session: UserSession = {
    userId: user.userId,
    apiKey: user.apiKey,
    role: user.role
  }
  
  userSession?.set(session)

  return session
  },
})

export const logoutUser = pikkuSessionlessFunc<void, void>({
  func: async (
    { userSession },
    _data,
    _session
  ) => {
    userSession?.clear()
  },
})

export const updateUser = pikkuSessionlessFunc<{ userId: string; name: string }, void>({
  func: async (
    { kysely },
    { userId, name }
  ) => {
    await kysely
      .updateTable('user')
      .set({ name })
      .where('userId', '=', userId)
      .executeTakeFirstOrThrow()
  },
})
