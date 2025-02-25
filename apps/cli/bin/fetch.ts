import { DB } from '@pikku-workspace-starter/sdk'
import { PikkuFetch } from '../pikku-fetch.gen.js'

export const fetch = async (serverUrl: string, apiKey?: string) => {
  const pikkuFetch = new PikkuFetch({
    serverUrl,
  })

  if (apiKey) {
    pikkuFetch.setAPIKey(apiKey)
  } else {
    const session = await pikkuFetch.post('/login', {
      name: 'Yasser'
    })
    pikkuFetch.setAPIKey(session.apiKey)
  }

  await pikkuFetch.post('/todo', { text: 'Hello, world!' })

  const todos = await pikkuFetch.get('/todos')
  console.log(`Todos: ${todos.map((todo) => todo.text).join(', ')}`)

  const todoViaParam = await pikkuFetch.get('/todo/:todoId', {
    todoId: todos[0].todoId,
  })
  console.log(`Param todo: ${todoViaParam.text}`)

  const todoQuery = await pikkuFetch.get('/todo', {
    todoId: todos[0].todoId,
  })
  console.log(`Query todo: ${todoQuery.text}`)

  await pikkuFetch.post('/todo/:todoId/vote', {
    todoId: todos[0].todoId,
    vote: DB.Vote.UP
  })

}
