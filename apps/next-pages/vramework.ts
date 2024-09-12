import { VrameworkNextJS } from '@vramework/deploy-next'

import { config } from '@todos/functions/src/config'
import { getRoutes } from '@todos/functions/generated/routes'
import '@todos/functions/generated/schemas'

import { createSingletonServices } from '@todos/functions/src/services'
import { CreateSessionServices } from '@vramework/core/types'
import { APIRoutes } from '@todos/functions/src/vramework-types'

const createSessionServices: CreateSessionServices = async (singletonServices) => {
    return {
        ...singletonServices,
    }
}

let _vramework: VrameworkNextJS<APIRoutes> | undefined

export const getVramework = async () => {
    if (_vramework) {
        return _vramework
    }
    const singletonServices = await createSingletonServices(config)
    const routes = getRoutes()
    _vramework = new VrameworkNextJS<APIRoutes>(
        routes,
        singletonServices, 
        createSessionServices
    )
    return _vramework
}