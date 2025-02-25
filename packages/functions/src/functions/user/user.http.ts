import { addRoute } from '@pikku/core/http'
import { isUserUpdatingSelf } from '../../permissions.js'
import { loginUser, logoutUser, updateUser } from './user.functions.js'

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
