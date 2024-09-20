import { isUserUpdatingSelf } from '../permissions'
import { type APIRoutes } from '../vramework-types'
import { loginUser, logoutUser, updateUser } from './user.functions'

export const routes: APIRoutes = [
  {
    method: 'post',
    route: '/login',
    schema: 'JustUserName',
    func: loginUser,
    requiresSession: false,
  },
  {
    method: 'post',
    schema: null,
    route: '/logout',
    func: logoutUser,
  },
  {
    method: 'patch',
    route: '/user/:userId',
    schema: 'UpdateUser',
    func: updateUser,
    permissions: {
      isUserUpdatingSelf,
    },
  },
]
