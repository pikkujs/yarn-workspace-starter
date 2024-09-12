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
        requiresSession: false,
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
        requiresSession: false,
    },
    {
        type: 'delete',
        route: '/todo/:todoId',
        schema: 'JustTodoId',
        func: deleteTodo,
        requiresSession: false,
    }
]
