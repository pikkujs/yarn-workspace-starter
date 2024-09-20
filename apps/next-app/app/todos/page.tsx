import { vramework } from '../../vramework'
import { TodosCard } from '@todos/components/TodosCard'
import { Todos } from '@todos/sdk/types/todo.types'

async function addTodo(text: string) {
  'use server'
  await vramework().actionRequest(
    {
      method: 'post',
      route: '/todo',
    },
    { text }
  )
}

async function toggleTodo(todoId: string, completedAt: Date | null) {
  'use server'
  await vramework().actionRequest(
    {
      method: 'patch',
      route: '/todo/:todoId',
    },
    {
      todoId,
      completedAt,
    }
  )
}

export default async function TodoPage() {
  const todos: Todos = await vramework().actionRequest(
    {
      method: 'get',
      route: '/todos',
    },
    {}
  )
  return <TodosCard todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} />
}
