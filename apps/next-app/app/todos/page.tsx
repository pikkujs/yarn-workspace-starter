import { TodosCard } from '@/components/TodosCard'
import { vramework } from '@/vramework-nextjs.gen'
import { AlreadyVotedError } from '@vramework-workspace-starter/functions/src/errors'
import { UpdateTodoInput, VoteOnTodoInput } from '@vramework-workspace-starter/sdk/.vramework/routes-map.gen'
import { revalidatePath } from 'next/cache'

async function addTodo(text: string) {
  'use server'
  await vramework().post('/todo', { text })
  revalidatePath('/')
}

async function toggleTodo({ todoId, completedAt }: Pick<UpdateTodoInput, 'todoId' | 'completedAt'>) {
  'use server'
  await vramework().patch('/todo/:todoId', { todoId, completedAt })
  revalidatePath('/')
}

async function voteOnTodo(data: VoteOnTodoInput) {
  'use server'
  try {
    await vramework().post('/todo/:todoId/vote', data)
    revalidatePath('/')
  } catch (e: any) {
    if (e.constructor.name !== AlreadyVotedError.name) {
      throw e
    } else {
      console.log('User cant vote more than once..')
    }
  }
}

export default async function TodoPage() {
  const todos = await vramework().staticGet('/todos')
  return <TodosCard todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} voteOnTodo={voteOnTodo} />
}
