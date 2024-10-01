import { isUserUpdatingSelf } from '../permissions'
import { addRoute } from '../vramework-types'
import { loginUser, logoutUser, updateUser } from './user.functions'

addRoute({
  method: 'post',
  route: '/login',
  func: loginUser,
  auth: false,
})

addRoute({
  method: 'post',
  route: '/logout',
  func: logoutUser,
})

addRoute({
  method: 'patch',
  route: '/user/:userId',
  func: updateUser,
  permissions: {
    isUserUpdatingSelf,
  },
})
