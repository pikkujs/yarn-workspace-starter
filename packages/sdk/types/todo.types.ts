import * as DB from '@vramework-workspace-starter/sdk/generated/db-pure'
import { User } from './user.types'

export type Todo = Omit<DB.AppTodo, '_ignore_'>

export type Todos = Array<Todo & Pick<User, 'name'>>
export type JustTodoId = Pick<DB.AppTodo, 'todoId'>
export type CreateTodo = Omit<
  DB.AppTodo,
  'todoId' | 'completedAt' | 'createdAt' | 'createdBy'
>
export type UpdateTodo = JustTodoId & Pick<DB.AppTodo, 'completedAt'>
