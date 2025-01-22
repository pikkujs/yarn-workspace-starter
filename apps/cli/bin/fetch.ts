import { VrameworkFetch } from '../vramework-fetch.gen.js'

export const fetch = async (serverUrl: string, apiKey?: string) => {
  const vrameworkFetch = new VrameworkFetch({
    serverUrl,
  })

  if (apiKey) {
    vrameworkFetch.setAPIKey(apiKey)
  } else {
    const session = await vrameworkFetch.post('/login', {
      name: 'Yasser'
    })
    vrameworkFetch.setAPIKey(session.apiKey)
  }

  await vrameworkFetch.post('/todo', { text: 'Hello, world!' })

  const todos = await vrameworkFetch.get('/todos')
  console.log(`Todos: ${todos.map((todo) => todo.text).join(', ')}`)

  const todoViaParam = await vrameworkFetch.get('/todo/:todoId', {
    todoId: todos[0].todoId,
  })
  console.log(`Param todo: ${todoViaParam.text}`)

  const todoQuery = await vrameworkFetch.get('/todo', {
    todoId: todos[0].todoId,
  })
  console.log(`Query todo: ${todoQuery.text}`)

  // await vrameworkFetch.delete('/todo/:todoId', { todoId: todos[0].todoId })
}
