import { type Todo, type Todos, type CreateTodo, type JustTodoId, type UpdateTodo } from "@todos/sdk/types/todo.types";
import { APIFunction, APIFunctionSessionless } from "../vramework-types";

export const getTodos: APIFunctionSessionless<unknown, Todos> = async (services) => {
    return await services.kysely
        .selectFrom('app.todo')
        .selectAll()
        .orderBy('createdAt', 'asc')
        .execute()
}

export const getTodo: APIFunctionSessionless<JustTodoId, Todo> = async (services, data) => {
    return await services.kysely
        .selectFrom('app.todo')
        .selectAll()
        .where('todoId', '=', data.todoId)
        .executeTakeFirstOrThrow()
}

export const createTodo: APIFunctionSessionless<CreateTodo, JustTodoId> = async (services, data) => {
    return await services.kysely
        .insertInto('app.todo')
        .values({
            ...data
        })
        .returning('todoId')
        .executeTakeFirstOrThrow()
}

export const updateTodo: APIFunctionSessionless<UpdateTodo, void> = async (services, { todoId, ...data }) => {
    await services.kysely
        .updateTable('app.todo')
        .set(data)
        .where('todoId', '=', todoId)
        .executeTakeFirstOrThrow()
}

export const deleteTodo: APIFunctionSessionless<JustTodoId, boolean> = async (services, { todoId }) => {
    try {
        await services.kysely
            .deleteFrom('app.todo')
            .where('todoId', '=', todoId)
            .executeTakeFirstOrThrow()
        return true
    } catch (e) {
        return false
    }
}