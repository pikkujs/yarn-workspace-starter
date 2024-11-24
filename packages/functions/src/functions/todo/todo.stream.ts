import { addStream } from '@vramework/core'
import { StreamConnect, StreamDisconnect, StreamMessage } from '../../../.vramework/vramework-types'
import { JustTodoId, Todo } from '@todos/sdk/types/todo.types'

const onConnect: StreamConnect = async (services, userSession) => {
    services.logger.info('Connected to event stream')
    // services.eventService.subscribe(data.topic, services.stream)
}

const onDisconnect: StreamDisconnect = async (services, userSession) => {
    services.logger.info('Disconnected from event stream')
    // services.eventService.subscribe(data.topic, services.stream)
}

const subscribe: StreamMessage<JustTodoId, unknown> = async (services, data, userSession) => {
    console.log('subcribing!', data)
}

const unsubscribe: StreamMessage<JustTodoId, unknown> = async (services, data) => {
    // services.eventService.subscribe(data.topic, services.stream)
}

const emit: StreamMessage<Todo, unknown> = async (services, data) => {
    // services.eventService.emit(data.topic, services.stream)
}

addStream({
    route: '/event',
    onConnect: onConnect,
    onDisconnect: onDisconnect,
    onMessage: [{
        route: 'subscribe',
        func: subscribe
    }, {
        route: 'unsubscribe',
        func: unsubscribe
    }, {
        route: 'emit',
        func: emit
    }],
    auth: false,
    docs: {
        description: 'A stream route',
        response: 'A message',
        errors: [],
        tags: ['stream'],
    },
})
