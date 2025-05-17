import { DB } from '@pikku-workspace-starter/sdk'
import type { PickRequired } from '@pikku/core'
import { AlreadyVotedError } from '../../errors.js'
import { pikkuFunc, pikkuSessionlessFunc, pikkuVoidFunc } from '#pikku/pikku-types.gen.js'

export const getTodos = pikkuSessionlessFunc<void, Array<DB.Todo & Pick<DB.User, 'name'> & { upvotes: number | null }>>(async (
  { kysely }
) => {
  const todos = await kysely
    .selectFrom('todo')
    .innerJoin('user', 'todo.createdBy', 'user.userId')
    .select(eb =>
      eb
        .selectFrom('todoVote')
        .select(kysely.fn.coalesce(
          kysely.fn.countAll(),
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
})

export const getTodo = pikkuSessionlessFunc<
  Pick<DB.Todo, 'todoId'>,
  DB.Todo & {}
>(async (
  { kysely},
  { todoId }
) => {
  return await kysely
    .selectFrom('todo')
    .selectAll()
    .leftJoin('user', 'todo.createdBy', 'user.userId')
    .where('todoId', '=', todoId)
    .executeTakeFirstOrThrow()
})

export const createTodo = pikkuFunc<Omit<
  DB.Todo & {},
  'todoId' | 'completedAt' | 'createdAt' | 'createdBy'
>, Pick<DB.Todo, 'todoId'>>(async (
  { kysely},
  data,
  session
) => {
  return await kysely
    .insertInto('todo')
    .values({
      ...data,
      createdBy: session.userId,
    })
    .returning('todoId')
    .executeTakeFirstOrThrow()
})

export const updateTodo = pikkuFunc<PickRequired<DB.Todo, 'todoId'>, void>(async (
  { kysely },
  { todoId, ...data }
) => {
  await kysely
    .updateTable('todo')
    .set(data)
    .where('todoId', '=', todoId)
    .executeTakeFirstOrThrow()
})

export const deleteTodo = pikkuFunc<Pick<DB.Todo, 'todoId'>, { success: boolean }>(async (
  { kysely },
  { todoId }
) => {
  try {
    await kysely
      .deleteFrom('todo')
      .where('todoId', '=', todoId)
      .executeTakeFirstOrThrow()
    return { success: true }
  } catch {
    return { success: false }
  }
})

export const expireTodos = pikkuVoidFunc(async (
  { logger },
) => {
  // TODO: Think of a better scheduled job
  logger.info('Expiring all todos')
})


export const voteOnTodo = pikkuFunc<Pick<DB.TodoVote, 'todoId' | 'vote'>, void>(async (
  { kysely },
  { todoId, vote },
  { userId }
) => {
  try {
    await kysely
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
})
