import { wireHTTP } from '#pikku/pikku-types.gen.js'
import { isUserUpdatingSelf } from '../../permissions.js'
import { loginUser, logoutUser, updateUser } from './user.functions.js'

wireHTTP({
  method: 'post',
  route: '/login',
  func: loginUser,
  auth: false,
})

wireHTTP({
  method: 'post',
  route: '/logout',
  func: logoutUser,
})

wireHTTP({
  method: 'patch',
  route: '/user/:userId',
  func: updateUser,
  permissions: {
    isUserUpdatingSelf,
  },
})
