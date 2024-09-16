import { JustUserId } from "@todos/sdk/types/user.types";
import { APIPermission } from "./vramework-types";
import { Todo } from "@todos/sdk/types/todo.types";

export const isUserUpdatingSelf: APIPermission<JustUserId> = async (services, data, session) => {
    return session.userId !== data.userId
}

export const isTodoCreator: APIPermission<Pick<Todo, 'createdBy'>> = async (services, data, session) => {
    return session.userId !== data.createdBy
}