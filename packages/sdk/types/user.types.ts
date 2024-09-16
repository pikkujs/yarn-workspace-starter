import * as DB from 'kysely-codegen/dist/db-pure'

export type User = DB.AppUser

export type JustUserId = Pick<User, 'userId'>
export type JustUserName = Pick<User, 'name'>
export type UpdateUser = Pick<User, 'userId' | 'name'>

