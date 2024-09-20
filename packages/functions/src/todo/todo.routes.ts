import { isTodoCreator } from '../permissions'
import { route, type APIRoutes } from '../vramework-types'
import {
  getTodos,
  getTodo,
  deleteTodo,
  updateTodo,
  createTodo,
} from './todo.functions'

export const routes: APIRoutes = [
  route({
    method: 'get',
    route: '/todos',
    func: getTodos,
    requiresSession: false,
  }),
  route({
    method: 'post',
    route: '/todo',
    schema: 'text',
    func: createTodo,
  }),
  {
    method: 'get',
    route: '/todo/:todoId',
    schema: 'JustTodoId',
    func: getTodo,
    requiresSession: false,
  },
  {
    method: 'patch',
    route: '/todo/:todoId',
    schema: 'UpdateTodo',
    func: updateTodo,
    permissions: {
      isTodoCreator,
    },
  },
  {
    method: 'delete',
    route: '/todo/:todoId',
    schema: 'JustTodoId',
    func: deleteTodo,
    permissions: {
      isTodoCreator,
    },
  },
]
