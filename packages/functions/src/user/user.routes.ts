import { isUserUpdatingSelf } from '../permissions'
import { type APIRoutes } from '../vramework-types'
import { loginUser, logoutUser, updateUser } from './user.functions'

export const routes: APIRoutes = [
  {
    type: 'post',
    route: '/login',
    schema: 'JustUserName',
    func: loginUser,
    requiresSession: false,
  },
  {
    type: 'post',
    route: '/logout',
    schema: null,
    func: logoutUser,
  },
  {
    type: 'patch',
    route: '/user/:userId',
    schema: 'UpdateUser',
    func: updateUser,
    permissions: {
      isUserUpdatingSelf,
    },
  },
]
