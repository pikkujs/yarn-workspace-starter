import { addScheduledTask } from '@vramework/core/scheduler'
import { expireTodos } from './todo.functions.js'

addScheduledTask({
    name: 'expireTodos',
    schedule: '*/1 * * * *',
    func: expireTodos,
    docs: {
        tags: ['todos']
    }
})