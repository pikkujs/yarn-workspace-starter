import type{ ChannelConnection, ChannelDisconnection, ChannelMessage } from '../../../.vramework/vramework-types.js'

export const onConnect: ChannelConnection<'hello!'> = async (services, channel) => {
    services.logger.info('Connected to event channel')
    channel.send('hello!')
}

export const onDisconnect: ChannelDisconnection = async (services, channel) => {
    services.logger.info('Disconnected from event channel')
}

export const authenticate: ChannelMessage<{ token: string }, { authResult: boolean }> = async (services, channel, data) => {
    const authResult = data.token === 'valid'
    if (authResult) {
        channel.setSession({ userId: 'Bob' })
    }
    channel.send({ authResult })
}

export const subscribe: ChannelMessage<{ name: string }, { action: 'subscribe', data: string }> = async (services, channel, data) => {
    // TODO: Setting up an interval works, but wouldn't be the best way to handle this
    // when deploying via serverless functions
    const interval = setInterval(() => {
        try {
            console.log('sending', data),
            channel.send({
                action: 'subscribe',
                data: `${data.name}: ${Math.random()}`
            })
        } catch (e) {
            // Channel is closed
            clearInterval(interval)
        }
    }, 1000)
}

export const unsubscribe: ChannelMessage<{ name: string }> = async (services, channel, data) => {
    console.log('got an unsubscribe message', data)
}

export const emitMessage: ChannelMessage<unknown, { timestamp: string }> = async (services, channel, data) => {
}

export const onMessage: ChannelMessage<'hello', 'hey'> = async (services, channel) => {
    channel.send('hey')
}
