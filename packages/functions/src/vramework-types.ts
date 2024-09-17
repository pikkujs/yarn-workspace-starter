import { Services, UserSession } from './api'

export type APIFunction<In, Out, RequiredServices = Services> = (
  services: RequiredServices,
  data: In,
  session: UserSession
) => Promise<Out>
export type APIFunctionSessionless<In, Out, RequiredServices = Services> = (
  services: RequiredServices,
  data: In,
  session?: UserSession | undefined
) => Promise<Out>
export type APIPermission<In, RequiredServices = Services> = (
  services: RequiredServices,
  data: In,
  session: UserSession
) => Promise<boolean>

export type APIRoute<In, Out> =
  | {
      type: 'post' | 'get' | 'delete' | 'patch' | 'head'
      route: string
      schema: string | null
      requiresSession?: undefined | true
      func: APIFunction<In, Out>
      permissions?: Record<string, APIPermission<In>[] | APIPermission<In>>
      isStream?: undefined | false
    }
  | {
      type: 'post' | 'get' | 'delete' | 'patch' | 'head'
      route: string
      schema: string | null
      requiresSession: false
      func: APIFunctionSessionless<In, Out>
      isStream?: undefined | false
    }
  | {
      type: 'get'
      route: string
      schema: string | null
      requiresSession?: undefined | true
      func: APIFunctionSessionless<In, Out>
      isStream: true
    }

export type APIRoutes = Array<APIRoute<any, any>>
