import { ConflictError } from '@pikku/core/errors'
import { isTodoCreator } from '../../permissions.js'
import { AlreadyVotedError } from '../../errors.js'

import {
  getTodos,
  getTodo,
  deleteTodo,
  updateTodo,
  createTodo,
  voteOnTodo,
} from './todo.functions.js'
import { addHTTPRoute } from '#pikku/pikku-types.gen.js'

addHTTPRoute({
  method: 'get',
  route: '/todos',
  func: getTodos,
  auth: false,
  middleware: [],
  docs: {
    description: 'Get all todos',
    tags: ['todos'],
  },
})

addHTTPRoute({
  method: 'get',
  route: '/todo/:todoId',
  func: getTodo,
  auth: true,
  middleware: [],
  permissions: {
    isTodoCreator,
  },
  docs: {
    description: 'Get all todos',
    tags: ['todos'],
  },
})

addHTTPRoute({
  method: 'get',
  route: '/todo',
  func: getTodo,
  auth: false,
})

addHTTPRoute({
  method: 'post',
  route: '/todo',
  func: createTodo,
  docs: {
    errors: [ConflictError],
  },
})

addHTTPRoute({
  method: 'patch',
  route: '/todo/:todoId',
  func: updateTodo,
  permissions: {
    isTodoCreator,
  },
})

addHTTPRoute({
  method: 'delete',
  route: '/todo/:todoId',
  func: deleteTodo,
  permissions: {
    isTodoCreator,
  },
})

addHTTPRoute({
  method: 'post',
  route: '/todo/:todoId/vote',
  func: voteOnTodo,
  docs: {
    errors: [AlreadyVotedError],
  },
})