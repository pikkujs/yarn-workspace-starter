import { DB } from '@pikku-workspace-starter/sdk'
import { APIPermission } from '../.pikku/pikku-types.gen.js'

export const isUserUpdatingSelf: APIPermission<Pick<DB.User, 'userId'>> = async (
  _services,
  data,
  session
) => {
  return session?.userId !== data.userId
}

export const isTodoCreator: APIPermission<Pick<DB.Todo, 'todoId'>> = async (
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
}
