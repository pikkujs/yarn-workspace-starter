import { isTodoCreator } from "../permissions";
import { type APIRoutes } from "../vramework-types";
import { getTodos, getTodo, deleteTodo, updateTodo, createTodo } from "./todo.functions";

export const routes: APIRoutes = [
    {
        type: 'get',
        route: '/todos',
        schema: null,
        func: getTodos,
        requiresSession: false,
    },
    {
        type: 'post',
        route: '/todo',
        schema: 'CreateTodo',
        func: createTodo,
    },
    {
        type: 'get',
        route: '/todo/:todoId',
        schema: 'JustTodoId',
        func: getTodo,
        requiresSession: false,
    },
    {
        type: 'patch',
        route: '/todo/:todoId',
        schema: 'UpdateTodo',
        func: updateTodo,
        permissions: {
            isTodoCreator
        }
    },
    {
        type: 'delete',
        route: '/todo/:todoId',
        schema: 'JustTodoId',
        func: deleteTodo,
        permissions: {
            isTodoCreator
        }
    }
]
