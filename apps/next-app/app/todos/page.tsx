import { vramework } from '@/vramework-nextjs'
import { TodosCard } from '@vramework-workspace-starter/components/TodosCard'

async function addTodo(text: string) {
  'use server'
  await vramework().actionRequest('/todo', 'post', { text })
}

async function toggleTodo(todoId: string, completedAt: Date | null) {
  'use server'
  await vramework().actionRequest('/todo/:todoId', 'patch', {
    todoId,
    completedAt,
  })
}

export default async function TodoPage() {
  const todos = await vramework().staticActionRequest('/todos', 'get', null)
  return <TodosCard todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} />
}
