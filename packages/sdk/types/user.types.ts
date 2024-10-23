import * as DB from '@todos/sdk/generated/db-pure'

export type User = DB.AppUser

export type JustUserId = Pick<User, 'userId'>
export type JustUserName = Pick<User, 'name'>
export type UpdateUser = Pick<User, 'userId' | 'name'>
export type Session = {}
