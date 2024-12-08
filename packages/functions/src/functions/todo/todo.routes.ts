import { ConflictError } from '@vramework/core/errors'
import { addRoute } from '@vramework/core/http'
import { isTodoCreator } from '../../permissions.js'
import {
  getTodos,
  getTodo,
  deleteTodo,
  updateTodo,
  createTodo,
} from './todo.functions.js'

addRoute({
  method: 'get',
  route: '/todos',
  func: getTodos,
  auth: false,
  docs: {
    description: 'Get all todos',
    tags: ['todos'],
  }
})

addRoute({
  method: 'get',
  route: '/todo/:todoId',
  func: getTodo,
  auth: false,
})

addRoute({
  method: 'get',
  route: '/todo',
  func: getTodo,
  auth: false,
})

addRoute({
  method: 'post',
  route: '/todo',
  func: createTodo,
  docs: {
    errors: [ConflictError]
  }
})

addRoute({
  method: 'patch',
  route: '/todo/:todoId',
  func: updateTodo,
  permissions: {
    isTodoCreator,
  },
})

addRoute({
  method: 'delete',
  route: '/todo/:todoId',
  func: deleteTodo,
  permissions: {
    isTodoCreator,
  },
})
