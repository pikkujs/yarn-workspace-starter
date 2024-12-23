import { VrameworkFetch } from "../vramework-fetch"

export const fetch = async (serverUrl: string, apiKey?: string) => {
    const vrameworkFetch = new VrameworkFetch({
        serverUrl,
    })

    if (apiKey) {
        vrameworkFetch.setAPIKey(apiKey)
    } else {
        const session = await vrameworkFetch.api('/login', 'post', { name: 'Yasser' })
        vrameworkFetch.setAPIKey(session.apiKey)
    }

    await vrameworkFetch.api('/todo', 'post', { text: 'Hello, world!' })

    const todos = await vrameworkFetch.api('/todos', 'get', null)
    console.log(`Todos: ${todos.map(todo => todo.name).join(', ')}`)

    const todoViaParam = await vrameworkFetch.api('/todo/:todoId', 'get', { todoId: todos[0].todoId })
    console.log(`Param todo: ${todoViaParam.text}`)

    const todoQuery = await vrameworkFetch.api('/todo', 'get', { todoId: todos[0].todoId})
    console.log(`Query todo: ${todoQuery.text}`)

    // await vrameworkFetch.api('/todo/:todoId', 'delete', { todoId: todos[0].todoId })
}
