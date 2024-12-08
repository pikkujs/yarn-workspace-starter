import { addScheduledTask } from '@vramework/core/scheduler'
import { expireTodos } from './todo.functions'

addScheduledTask({
    name: 'expireTodos',
    schedule: '0 0 0 * * *',
    func: expireTodos,
    docs: {
        tags: ['todos']
    }
})