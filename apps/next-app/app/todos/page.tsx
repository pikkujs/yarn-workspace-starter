import { TodosCard } from '@/components/TodosCard'
import { vramework } from '@/vramework-nextjs.gen'
import { revalidatePath } from 'next/cache'

async function addTodo(text: string) {
  'use server'
  await vramework().post('/todo', { text })
  revalidatePath('/')
}

async function toggleTodo(todoId: string, completedAt: Date | null) {
  'use server'
  await vramework().patch('/todo/:todoId', {
    todoId,
    completedAt,
  })
  revalidatePath('/')
}

export default async function TodoPage() {
  const todos = await vramework().staticGet('/todos')
  return <TodosCard todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} />
}
