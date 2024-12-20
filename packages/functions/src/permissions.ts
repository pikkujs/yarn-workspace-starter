import { APIPermission } from '../.vramework/vramework-types.js'
import { JustUserId } from '@vramework-workspace-starter/sdk/types/user.types.js'
import { JustTodoId } from '@vramework-workspace-starter/sdk/types/todo.types.js'

export const isUserUpdatingSelf: APIPermission<JustUserId> = async (
  _services,
  data,
  session
) => {
  return session?.userId !== data.userId
}

export const isTodoCreator: APIPermission<JustTodoId> = async (
  services,
  { todoId },
  session
) => {
  const { createdBy } = await services.kysely.selectFrom('app.todo')
    .select('createdBy')
    .where('todoId', '=', todoId)
    .executeTakeFirstOrThrow()

  return session?.userId === createdBy
}
