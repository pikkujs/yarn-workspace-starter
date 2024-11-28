import { addChannel, JSONValue } from '@vramework/core'
import { ChannelConnection, ChannelMessageSessionless } from '../../../.vramework/vramework-types'
import { JustTodoId, Todo } from '@todos/sdk/types/todo.types'
import { JustUserName } from '@todos/sdk/types/user.types'
import { VrameworkChannel } from '@vramework/core/dist/cjs/channel/vramework-channel'

const onConnect: ChannelConnection = async (services, channel) => {
    services.logger.info('Connected to event channel')
    // services.eventService.subscribe(data.topic, services.channel)

    channel.send({ name: 'bob' })
}

const onDisconnect: ChannelConnection = async (services) => {
    services.logger.info('Disconnected from event channel')
    // services.eventService.subscribe(data.topic, services.channel)
}

const subscribe: ChannelMessageSessionless<JustTodoId> = async (services, channel, userSession) => {
    channel.getOpeningData()
}

const unsubscribe: ChannelMessageSessionless<JustTodoId, JustTodoId> = async (services, channel, data) => {
    // services.eventService.subscribe(data.topic, services.channel)
    channel.send({
        name: 'bob'
    })
}

const emit: ChannelMessageSessionless<JSONValue, JustTodoId | JustUserName> = async (services, data) => {
    // services.eventService.emit(data.topic, services.channel)
}

const onMessage: ChannelMessageSessionless<Todo, JustTodoId | JustUserName> = async (services, channel) => {
    // services.eventService.emit(data.topic, services.channel)
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
