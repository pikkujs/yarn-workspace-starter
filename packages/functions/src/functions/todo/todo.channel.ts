import { addChannel } from '@vramework/core/channel'
import { ChannelConnection, ChannelDisconnection, ChannelMessage } from '../../../.vramework/vramework-types.js'
import { JustTodoId, Todo } from '@todos/sdk/types/todo.types.js'

const onConnect: ChannelConnection<'hello!'> = async (services, channel) => {
    services.logger.info('Connected to event channel')
    channel.send('hello!')
}

const onDisconnect: ChannelDisconnection = async (services, channel) => {
    services.logger.info('Disconnected from event channel')
}

const subscribe: ChannelMessage<JustTodoId, { name: string }> = async (services, channel) => {
    const interval = setInterval(() => {
        try {
            channel.send({
                name: `bob ${Math.random()}`
            })
        } catch {
            clearInterval(interval)
        }
    }, 1000)
}

const unsubscribe: ChannelMessage<JustTodoId, JustTodoId> = async (services, channel, data) => {
    console.log('got an unsubscribe message', data)
}

const emit: ChannelMessage<JustTodoId, Todo> = async (services, channel, data) => {
}

const onMessage: ChannelMessage<'hello', 'hey'> = async (services, channel) => {
}

addChannel({
    channel: '/event',
    onConnect,
    onDisconnect,
    onMessage,
    onMessageRoute: {
        action: {
            subscribe: {
                func: subscribe
            },
            unsubscribe,
            emit
        }
    },
    auth: false,
    docs: {
        description: 'A channel route',
        response: 'A message',
        errors: [],
        tags: ['channel'],
    },
})
