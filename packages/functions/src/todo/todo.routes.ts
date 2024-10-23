import { addRoute } from '@vramework/core'
import { isTodoCreator } from '../permissions'
import {
  getTodos,
  getTodo,
  deleteTodo,
  updateTodo,
  createTodo,
} from './todo.functions'

addRoute({
  method: 'get',
  route: '/todos',
  func: getTodos,
  auth: false,
})

addRoute({
  method: 'post',
  route: '/todo',
  func: createTodo,
})

addRoute({
  method: 'get',
  route: '/todo/:todoId',
  func: getTodo,
  auth: false,
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
