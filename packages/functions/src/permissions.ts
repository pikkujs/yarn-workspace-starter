import { DB } from '@pikku-workspace-starter/sdk'
import { pikkuPermission } from '../.pikku/pikku-types.gen.js'

export const isUserUpdatingSelf = pikkuPermission<Pick<DB.User, 'userId'>>(async (
  _services,
  data,
  session
) => {
  return session?.userId !== data.userId
})

export const isTodoCreator = pikkuPermission<Pick<DB.Todo, 'todoId'>>(async (
  services,
  { todoId },
  session
) => {
  const { createdBy } = await services.kysely
    .selectFrom('todo')
    .select('createdBy')
    .where('todoId', '=', todoId)
    .executeTakeFirstOrThrow()

  return session?.userId === createdBy
})
