import {
  pikkuChannelConnectionFunc,
  pikkuChannelDisconnectionFunc,
  pikkuChannelFunc
} from '#pikku/pikku-types.gen.js'

export const onConnect = pikkuChannelConnectionFunc<'hello!'>(async (
  { logger, channel },
) => {
  logger.info(
    `Connected to event channel with opening data ${JSON.stringify(channel.openingData)}`
  )
  channel.send('hello!')
})

export const onDisconnect = pikkuChannelDisconnectionFunc(async ({ logger, channel }) => {
  logger.info(
    `Disconnected from event channel with data ${JSON.stringify(channel.openingData)}`
  )
})

export const authenticate = pikkuChannelFunc<
  { token: string; userId: string },
  { authResult: boolean; action: 'auth' }
>(async ({ userSession }, data) => {
  const authResult = data.token === 'valid'
  if (authResult) {
    await userSession?.set({ userId: data.userId })
  }
  return { authResult, action: 'auth' }
})

export const subscribe = pikkuChannelFunc<{ name: string }, never>(async (
  { eventHub, channel },
  data
) => {
  await eventHub?.subscribe(data.name, channel.channelId)
})

export const unsubscribe = pikkuChannelFunc<{ name: string }, never>(async (
  { eventHub, channel},
  data
) => {
  await eventHub?.unsubscribe(data.name, channel.channelId)
})

export const emitMessage = pikkuChannelFunc<
  { name: string },
  { timestamp: string; from: string } | { message: string }
>(async ({ channel, eventHub }, data, session) => {
  await eventHub?.publish(data.name, channel.channelId, {
    timestamp: new Date().toISOString(),
    from: session?.userId ?? 'anonymous',
  })
})

export const onMessage = pikkuChannelFunc<'hello', 'hey'>(async (
  { logger, channel },
  data
) => {
  logger.info(
    `Got a generic '${data}' message with data ${JSON.stringify(channel.openingData)}`
  )
  channel.send('hey')
})
