import * as DB from 'kysely-codegen/dist/db-pure'

export type Todo = DB.AppTodo

export type Todos = Todo[]
export type JustTodoId = Pick<Todo, 'todoId'>
export type CreateTodo = Omit<Todo, 'todoId' | 'completedAt' | 'createdAt'>
export type UpdateTodo = JustTodoId & Pick<Todo, 'completedAt'>

