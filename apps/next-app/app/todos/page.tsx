import { TodosCard } from '@/components/TodosCard'
import { pikku} from '@/pikku-nextjs.gen'
import { UpdateTodoInput, VoteOnTodoInput } from '@pikku-workspace-starter/functions/.pikku/http/pikku-http-wirings-map.gen'
import { AlreadyVotedError } from '@pikku-workspace-starter/functions/src/errors'
import { revalidatePath } from 'next/cache'

async function addTodo(text: string) {
  'use server'
  await pikku().post('/todo', { text })
  revalidatePath('/')
}

async function toggleTodo({ todoId, completedAt }: Pick<UpdateTodoInput, 'todoId' | 'completedAt'>) {
  'use server'
  await pikku().patch('/todo/:todoId', { todoId, completedAt })
  revalidatePath('/')
}

async function voteOnTodo(data: VoteOnTodoInput) {
  'use server'
  try {
    await pikku().post('/todo/:todoId/vote', data)
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
  const todos = await pikku().staticGet('/todos')
  return <TodosCard todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} voteOnTodo={voteOnTodo} />
}
