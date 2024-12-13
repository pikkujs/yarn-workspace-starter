import type { ChannelConnection, ChannelDisconnection, ChannelMessage } from '../../../.vramework/vramework-types.js'

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

export const subscribe: ChannelMessage<{ name: string }> = async (services, channel, data) => {
    await channel.subscriptions.subscribe(data.name, channel.channelId)
}

export const unsubscribe: ChannelMessage<{ name: string }> = async (services, channel, data) => {
    await channel.subscriptions.unsubscribe(data.name, channel.channelId)
}

export const emitMessage: ChannelMessage<{ name: string }, { timestamp: string } | { message: string }> = async (services, channel, data) => {
    await channel.subscriptions.broadcast(data.name, channel.channelId, { timestamp: new Date().toISOString() })
    await channel.broadcast({ message: `broadcasted from ${channel.channelId}` })
}

export const onMessage: ChannelMessage<'hello', 'hey'> = async (services, channel) => {
    channel.send('hey')
}
