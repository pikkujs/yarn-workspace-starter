import type { Todo, User } from '@vramework-workspace-starter/sdk/generated/db-pure.gen.js'
import { APIPermission } from '../.vramework/vramework-types.js'

export const isUserUpdatingSelf: APIPermission<Pick<User, 'userId'>> = async (
  _services,
  data,
  session
) => {
  return session?.userId !== data.userId
}

export const isTodoCreator: APIPermission<Pick<Todo, 'todoId'>> = async (
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
