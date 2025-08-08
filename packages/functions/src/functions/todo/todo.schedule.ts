import { wireScheduler } from '../../../.pikku/pikku-types.gen.js'
import { expireTodos } from './todo.functions.js'

wireScheduler({
  name: 'expireTodos',
  schedule: '* * * * 1',
  func: expireTodos,
  docs: {
    tags: ['todos'],
  },
})
