import { DB } from '@pikku-workspace-starter/sdk'
import { PikkuRPC } from '../pikku-rpc.gen.js'

export const rpc = async (serverUrl: string, apiKey?: string) => {
  const pikkuRPC = new PikkuRPC()
  pikkuRPC.setServerUrl(serverUrl)

  if (apiKey) {
    pikkuRPC.setAuthorizationJWT(apiKey)
  } else {
    const session = await pikkuRPC.invoke('loginUser', {
      name: 'Yasser'
    })
    pikkuRPC.setAPIKey(session.apiKey)
  }

  {
    const todo = await pikkuRPC.invoke('createTodo', { text: 'Hello, world!' })
    console.log(`Created todo: ${todo.todoId}`)
  }

  const todos = await pikkuRPC.invoke('getTodos', null)
  console.log(`Todos: ${todos.map((todo) => todo.text).join(', ')}`)

  const todo = await pikkuRPC.invoke('getTodo', {
    todoId: todos[0].todoId,
  })
  console.log(`Param todo: ${todo.text}`)

  await pikkuRPC.invoke('voteOnTodo', {
    todoId: todos[0].todoId,
    vote: DB.Vote.UP
  })
}
