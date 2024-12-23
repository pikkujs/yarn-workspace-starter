import { APIGatewayProxyEvent } from 'aws-lambda'
import {
  vrameworkCorslessHandler,
  vrameworkCorsHandler,
} from '@vramework/lambda/http'

import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import {
  createSessionServices,
  createSingletonServices,
} from '@vramework-workspace-starter/functions/src/services'

import '@vramework-workspace-starter/functions/.vramework/vramework-schemas/register'
import '@vramework-workspace-starter/functions/.vramework/vramework-routes'

import {
  Config,
  SingletonServices,
} from '@vramework-workspace-starter/functions/types/application-types'

let config: Config
let singletonServices: SingletonServices

const coldStart = async () => {
  if (!config) {
    config = await createConfig()
  }
  if (!singletonServices) {
    singletonServices = await createSingletonServices(
      config,
      new AWSSecrets(config)
    )
  }
}

export const corslessHandler = async (event: APIGatewayProxyEvent) => {
  await coldStart()
  return await vrameworkCorslessHandler(
    event,
    singletonServices,
    createSessionServices
  )
}

export const corsHandler = async (event: APIGatewayProxyEvent) => {
  await coldStart()
  return await vrameworkCorsHandler(
    event,
    [],
    singletonServices,
    createSessionServices
  )
}
