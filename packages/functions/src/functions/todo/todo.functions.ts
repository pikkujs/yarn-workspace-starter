import * as DB from '@vramework-workspace-starter/sdk/generated/db-pure.gen.js'
import type { APIFunction, APIFunctionSessionless } from '#vramework/vramework-types.js'
import type { PickRequired } from '@vramework/core'
import { AlreadyVotedError } from '../../errors.js'

export const getTodos: APIFunctionSessionless<void, Array<DB.Todo & Pick<DB.User, 'name'> & { upvotes: number | null }>> = async (
  services
) => {
  const todos = await services.kysely
    .selectFrom('todo')
    .innerJoin('user', 'todo.createdBy', 'user.userId')
    .select(eb => 
      eb
        .selectFrom('todoVote')
        .select(services.kysely.fn.coalesce(
          services.kysely.fn.countAll(),
          eb.lit(0)
        ).$castTo<string>().as('upvotes'))
        .whereRef('todoVote.todoId', '=', 'todo.todoId')
        .where('todoVote.vote', '=', DB.Vote.UP)
        .as('upvotes')
    )
    .selectAll('todo')
    .select('user.name')
    .orderBy('createdAt', 'asc')
    .execute()

    return todos.map(todo => ({ ...todo, upvotes: todo.upvotes ? Number(todo.upvotes) : 0 }))
}

export const getTodo: APIFunctionSessionless<Pick<DB.Todo, 'todoId'>, DB.Todo> = async (
  services,
  data
) => {
  return await services.kysely
    .selectFrom('todo')
    .selectAll()
    .leftJoin('user', 'todo.createdBy', 'user.userId')
    .where('todoId', '=', data.todoId)
    .executeTakeFirstOrThrow()
}

export const createTodo: APIFunction<Omit<
  DB.Todo,
  'todoId' | 'completedAt' | 'createdAt' | 'createdBy'
>, Pick<DB.Todo, 'todoId'>> = async (
  services,
  data,
  session
) => {
    return await services.kysely
      .insertInto('todo')
      .values({
        ...data,
        createdBy: session.userId,
      })
      .returning('todoId')
      .executeTakeFirstOrThrow()
  }

export const updateTodo: APIFunction<PickRequired<DB.Todo, 'todoId'>, void> = async (
  services,
  { todoId, ...data }
) => {
  await services.kysely
    .updateTable('todo')
    .set(data)
    .where('todoId', '=', todoId)
    .executeTakeFirstOrThrow()
}

export const deleteTodo: APIFunction<Pick<DB.Todo, 'todoId'>, { success: boolean }> = async (
  services,
  { todoId }
) => {
  try {
    await services.kysely
      .deleteFrom('todo')
      .where('todoId', '=', todoId)
      .executeTakeFirstOrThrow()
    return { success: true }
  } catch {
    return { success: false }
  }
}

export const expireTodos: APIFunctionSessionless<void, void> = async (
  services,
  _data
) => {
  // TODO: Think of a better scheduled job
  services.logger.info('Expiring all todos')
}


export const voteOnTodo: APIFunction<Pick<DB.TodoVote, 'todoId' | 'vote'>, void> = async (
  services,
  { todoId, vote },
  { userId }
) => {
  try {
    await services.kysely
      .insertInto('todoVote')
      .values({
        todoId,
        userId,
        vote,
      })
      .execute()
  } catch (e) {
    throw new AlreadyVotedError()
  }
}
