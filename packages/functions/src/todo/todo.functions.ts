import { type Todo, type Todos, type CreateTodo, type JustTodoId, type UpdateTodo } from "@todos/sdk/types/todo.types";
import { APIFunction, APIFunctionSessionless } from "../vramework-types";

export const getTodos: APIFunctionSessionless<unknown, Todos> = async (services) => {
    return await services.kysely
        .selectFrom('app.todo')
        .innerJoin('app.user', 'app.todo.createdBy', 'app.user.userId')
        .selectAll('app.todo')
        .select('app.user.name')
        .orderBy('createdAt', 'asc')
        .execute()
}

export const getTodo: APIFunctionSessionless<JustTodoId, Todo> = async (services, data) => {
    return await services.kysely
        .selectFrom('app.todo')
        .selectAll()
        .leftJoin('app.user', 'app.todo.createdBy', 'app.user.userId')
        .where('todoId', '=', data.todoId)
        .executeTakeFirstOrThrow()
}

export const createTodo: APIFunction<CreateTodo, JustTodoId> = async (services, data, session) => {
    return await services.kysely
        .insertInto('app.todo')
        .values({
            ...data,
            createdBy: session.userId,
        })
        .returning('todoId')
        .executeTakeFirstOrThrow()
}

export const updateTodo: APIFunction<UpdateTodo, void> = async (services, { todoId, ...data }) => {
    await services.kysely
        .updateTable('app.todo')
        .set(data)
        .where('todoId', '=', todoId)
        .executeTakeFirstOrThrow()
}

export const deleteTodo: APIFunction<JustTodoId, boolean> = async (services, { todoId }) => {
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