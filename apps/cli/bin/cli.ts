import { VrameworkFetch } from '../vramework-fetch'

const main = async () => {
    const vrameworkFetch = new VrameworkFetch({
        serverUrl: 'http://localhost:4002'
    })
    const todos = await vrameworkFetch.api('/todos', 'get', null)
    console.log(`Todos: ${todos.map(todo => todo.name).join(', ')}`)

    const todoViaParam = await vrameworkFetch.api('/todo/:todoId', 'get', { todoId: todos[0].todoId })
    console.log(`Param todo: ${todoViaParam.text}`)

    const todoQuery = await vrameworkFetch.api('/todo', 'get', { todoId: todos[0].todoId})
    console.log(`Query todo: ${todoQuery.text}`)

    await vrameworkFetch.api('/todo/:todoId', 'delete', { todoId: todos[0].todoId })

}

main()