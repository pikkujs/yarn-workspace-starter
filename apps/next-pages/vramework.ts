'server-only'
import '@todos/functions/generated/schemas'

import { VrameworkNextJS } from '@vramework/deploy-next'

import { config } from '@todos/functions/src/config'
import { getRoutes } from '@todos/functions/generated/routes'
import { createSingletonServices } from '@todos/functions/src/services'
import { CreateSessionServices } from '@vramework/core/types'
import { APIRoutes } from '@todos/functions/src/vramework-types'

const createSessionServices: CreateSessionServices = async (
  singletonServices
) => {
  return {
    ...singletonServices,
  }
}

let _vramework: VrameworkNextJS<APIRoutes> | undefined

export const vramework = () => {
  if (_vramework) {
    return _vramework
  }
  const routes = getRoutes()
  _vramework = new VrameworkNextJS<APIRoutes>(
    config,
    routes,
    createSingletonServices as any,
    createSessionServices
  )
  return _vramework
}
