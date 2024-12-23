import { APIGatewayProxyEvent } from 'aws-lambda'
import {
  corsHTTP,
  corslessHTTP,
} from '@vramework/lambda/http'
import {
  createSessionServices,
} from '@vramework-workspace-starter/functions/src/services'

import '@vramework-workspace-starter/functions/.vramework/vramework-schemas/register'
import '@vramework-workspace-starter/functions/.vramework/vramework-routes'
import { coldStart } from './cold-start'

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
