import { DB } from '@vramework-workspace-starter/sdk'
import { APIPermission } from '../.vramework/vramework-types.gen.js'

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
