import { vramework } from "../../vramework"
import { TodosCard } from "@todos/components/TodosCard"
import { Todos } from "@todos/sdk/types/todo.types"

async function addTodo (text: string) {
  "use server"
  await vramework().actionRequest({
    type: 'post',
    route: '/todo',
  }, { text })
}

async function toggleTodo (todoId: string, completedAt: Date | null) { 
  "use server"
  await vramework().actionRequest({
    type: 'patch',
    route: '/todo/:todoId',
  }, { 
    todoId,
    completedAt 
  })
}

export default async function TodoPage () {
  const todos: Todos = await vramework().actionRequest({
    type: 'get',
    route: '/todos',
  }, {})
  return (
    <TodosCard todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} />
  );
}
