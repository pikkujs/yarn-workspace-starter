import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda'

import {
  connectWebsocket,
  disconnectWebsocket,
  LambdaEventHubService,
  processWebsocketMessage,
} from '@vramework/lambda/websocket'

import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import { createSingletonServices } from '@vramework-workspace-starter/functions/src/services'

import {
  Config,
  SingletonServices,
} from '@vramework-workspace-starter/functions/types/application-types'

import { AWSSecrets } from '@vramework/aws-services'

import '@vramework-workspace-starter/functions/.vramework/vramework-channels'
import { KyselyChannelStore } from './kysely-channel-store'
import { ChannelStore } from '@vramework/core/channel'
import { KyselyEventHubStore } from './kysely-subscription-store'
import { MakeRequired } from '@vramework/core'
import { LocalVariablesService } from '@vramework/core/services'

let state:
  | {
      config: Config
      singletonServices: MakeRequired<SingletonServices, 'eventHub'>
      channelStore: ChannelStore
    }
  | undefined

const getParams = async (event: APIGatewayEvent) => {
  if (!state) {
    const config = await createConfig()
    const variablesService = new LocalVariablesService()
    const singletonServices = await createSingletonServices(
      config,
      variablesService,
      new AWSSecrets(config)
    )
    const channelStore = new KyselyChannelStore(singletonServices.kysely)
    const eventHubStore = new KyselyEventHubStore(singletonServices.kysely)
    singletonServices.eventHub = new LambdaEventHubService(
      singletonServices.logger,
      event,
      channelStore,
      eventHubStore
    )
    state = {
      config,
      singletonServices: singletonServices as MakeRequired<
        typeof singletonServices,
        'eventHub'
      >,
      channelStore,
    }
  }
  return state
}

export const connectHandler: APIGatewayProxyHandler = async (event) => {
  const params = await getParams(event)
  await connectWebsocket(event, params)
  return { statusCode: 200, body: '' }
}

export const disconnectHandler: APIGatewayProxyHandler = async (event) => {
  const params = await getParams(event)
  return await disconnectWebsocket(event, params)
}

export const defaultHandler: APIGatewayProxyHandler = async (event) => {
  const params = await getParams(event)
  return await processWebsocketMessage(event, params)
}
