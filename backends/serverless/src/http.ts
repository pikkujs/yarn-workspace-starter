import { APIGatewayProxyEvent } from 'aws-lambda'
import {
  corsHTTP,
  corslessHTTP,
} from '@vramework/lambda/http'
import {
  createSessionServices,
} from '@vramework-workspace-starter/functions/src/services'

import '@vramework-workspace-starter/functions/.vramework/vramework-schemas/register.gen'
import '@vramework-workspace-starter/functions/.vramework/vramework-routes.gen'
import { coldStart } from './cold-start.js'

export const corslessHandler = async (event: APIGatewayProxyEvent) => {
  const singletonServices = await coldStart()
  return await corslessHTTP(
    event,
    singletonServices,
    createSessionServices
  )
}

export const corsHandler = async (event: APIGatewayProxyEvent) => {
  const singletonServices = await coldStart()
  return await corsHTTP(
    event,
    [],
    singletonServices,
    createSessionServices
  )
}
