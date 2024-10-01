import { Services, UserSession } from './api'

import { CoreAPIFunction, CoreAPIPermission, CoreAPIRoute, addCoreRoute, AssertRouteParams } from '@vramework/core'

export type APIFunctionSessionless<In, Out, RequiredServices = Services> = CoreAPIFunction<In, Out, RequiredServices, UserSession>
export type APIFunction<In, Out, RequiredServices = Services> = CoreAPIFunction<In, Out, RequiredServices, UserSession>
export type APIPermission<In, RequiredServices = Services> = CoreAPIPermission<In, RequiredServices, UserSession>

type APIRoute<In, Out, Route extends string> = CoreAPIRoute<In, Out, Route, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>
export const addRoute = <In, Out, Route extends string>(route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>) => {
  addCoreRoute(route as any)
}