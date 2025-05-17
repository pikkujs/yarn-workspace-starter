import { addHTTPRoute } from '@pikku/core/http'
import { isUserUpdatingSelf } from '../../permissions.js'
import { loginUser, logoutUser, updateUser } from './user.functions.js'

addHTTPRoute({
  method: 'post',
  route: '/login',
  func: loginUser,
  auth: false,
})

addHTTPRoute({
  method: 'post',
  route: '/logout',
  func: logoutUser,
})

addHTTPRoute({
  method: 'patch',
  route: '/user/:userId',
  func: updateUser,
  permissions: {
    isUserUpdatingSelf,
  },
})
