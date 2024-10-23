
'server-only'
import { VrameworkNextJS } from '@vramework/next'
import { IncomingMessage, ServerResponse } from 'http'
import { NextApiRequest, NextApiResponse } from 'next/dist/shared/lib/utils'
import { APIRouteMethod } from '@vramework/core'

import { config } from '@todos/functions/src/config'
import { createSingletonServices } from '@todos/functions/src/services'
import { createSessionServices } from '@todos/functions/src/services'

import { RoutesMap, RouteHandlerOf } from '@todos/functions/generated/routes'
import '@todos/functions/generated/routes'
import '@todos/functions/generated/schemas'

let _vramework: VrameworkNextJS | undefined

export const vramework = () => {
  if (!_vramework) {
    _vramework = new VrameworkNextJS(
      config,
      createSingletonServices as any,
      createSessionServices
    )
  }

  const actionRequest = async <
    Route extends keyof RoutesMap,
    Method extends keyof RoutesMap[Route]
  >(
    route: Route,
    method: Method,
    data: RouteHandlerOf<Route, Method>['input']
  ): Promise<RouteHandlerOf<Route, Method>['output']> => {
    return _vramework!.actionRequest(route, method, data as any)
  }

  const staticActionRequest = async <
    Route extends keyof RoutesMap,
    Method extends keyof RoutesMap[Route]
  >(
    route: Route,
    method: Method,
    data: RouteHandlerOf<Route, Method>['input']
  ): Promise<RouteHandlerOf<Route, Method>['output']> => {
    return _vramework!.staticActionRequest(route, method, data as any)
  }

  const ssrRequest = <Route extends keyof RoutesMap, Method extends keyof RoutesMap[Route]>(
    request: IncomingMessage & {
      cookies: Partial<{ [key: string]: string }>;
    },
    response: ServerResponse<IncomingMessage>,
    route: Route,
    method: Method,
    data: RouteHandlerOf<Route, Method>['input']
  ): Promise<RouteHandlerOf<Route, Method>['output']> => {
    return _vramework!.ssrRequest(request, response, route, method as APIRouteMethod, data as any)
  }

  const apiRequest = <Route extends keyof RoutesMap, Method extends keyof RoutesMap[Route]>(
    request: NextApiRequest,
    response: NextApiResponse,
    route: Route,
    method: Method,
  ): Promise<void> => {
    return _vramework!.apiRequest(request, response, route, method as APIRouteMethod)
  }

  return {
    staticActionRequest,
    actionRequest,
    apiRequest,
    ssrRequest
  }
}