
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { vrameworkConnectHandler, vrameworkDisconnectHandler, vrameworkMessageHandler } from '@vramework/lambda/websocket'

import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import { createSessionServices, createSingletonServices } from '@vramework-workspace-starter/functions/src/services'

import { Config, SingletonServices } from '@vramework-workspace-starter/functions/types/application-types'
import { ServerlessChannelStore } from '@vramework/core/channel/serverless'
import { KyselyWebsocketStore } from './kysely-serverless-websocket-store'

import '@vramework-workspace-starter/functions/.vramework/vramework-channels'

let config: Config
let singletonService: SingletonServices
let channelStore: ServerlessChannelStore

const coldStart = async () => {
    if (!config) [
      config = await createConfig()
    ]
    if (!singletonService) {
      singletonService = await createSingletonServices(config)
    }
    if (!channelStore) {
      channelStore = new KyselyWebsocketStore(singletonService.kysely)
    }
}

export const connectHandler: APIGatewayProxyHandlerV2 = async (event) => {
  await coldStart()
  await vrameworkConnectHandler(event, channelStore, singletonService, createSessionServices)
  return { statusCode: 200, body: '' }
}

export const disconnectHandler: APIGatewayProxyHandlerV2 = async (event) => {
  await coldStart()
  return await vrameworkDisconnectHandler(event, channelStore, singletonService, createSessionServices)
}

export const defaultHandler: APIGatewayProxyHandlerV2 = async (event) => {
    await coldStart()
    return await vrameworkMessageHandler(event, channelStore, singletonService, createSessionServices)
}
