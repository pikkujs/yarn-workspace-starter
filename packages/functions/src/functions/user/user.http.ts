import { wireHTTP } from '#pikku/pikku-types.gen.js'
import { loginUser, logoutUser, updateUser } from './user.functions.js'

wireHTTP({
  method: 'post',
  route: '/auth/login',
  func: loginUser,
  auth: false,
})

wireHTTP({
  method: 'post',
  route: '/auth/logout',
  func: logoutUser,
})

wireHTTP({
  method: 'patch',
  route: '/auth/user/:userId',
  func: updateUser,
})
