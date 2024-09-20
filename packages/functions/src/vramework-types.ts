import { Services, UserSession } from './api'
import { CoreAPIFunction, CoreAPIPermission, CoreAPIRoute } from '@vramework/core/routes'

export type APIFunctionSessionless<In, Out, RequiredServices = Services> = CoreAPIFunction<In, Out, RequiredServices, UserSession>
export type APIFunction<In, Out, RequiredServices = Services> = CoreAPIFunction<In, Out, RequiredServices, UserSession>
export type APIPermission<In, RequiredServices = Services> = CoreAPIPermission<In, RequiredServices, UserSession>
export type APIRoute<In, Out> = CoreAPIRoute<In, Out, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>
export type APIRoutes = Array<APIRoute<any, any>>;

export const route = <In, Out>(route: APIRoute<In, Out>): APIRoute<In, Out> => route
