import { JustUserId } from '@todos/sdk/types/user.types'
import { APIPermission } from './vramework-types'
import { JustTodoId } from '@todos/sdk/types/todo.types'

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
  return session?.userId !== createdBy
}
