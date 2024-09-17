import { vramework } from '../../vramework'
import { GetServerSideProps } from 'next'
import { TodosCard } from '@todos/components/TodosCard'
import { useCallback, useState } from 'react'
import { Todos } from '@todos/sdk/types/todo.types'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const todos: Todos = await vramework().ssrRequest(
    req,
    res,
    {
      type: 'get',
      route: '/todos',
    },
    {}
  )

  return {
    props: {
      todos,
    },
  }
}

export default function TodoPage(props: { todos: Todos }) {
  const [todos, setTodos] = useState(props.todos)

  const refreshTodos = useCallback(async () => {
    const result = await fetch('/api/todos')
    const todos = await result.json()
    setTodos(todos)
  }, [])

  const addTodo = useCallback(async (text: string) => {
    await fetch('/api/todo', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    refreshTodos()
  }, [])

  const toggleTodo = useCallback(
    async (todoId: string) => {
      const todo = todos.find((todo) => todo.todoId === todoId)
      await fetch('/api/todo', {
        method: 'PATCH',
        body: JSON.stringify({
          todoId,
          completedAt: todo?.completedAt ? null : new Date(),
        }),
      })
      refreshTodos()
    },
    [todos]
  )

  return <TodosCard todos={todos} addTodo={addTodo} toggleTodo={toggleTodo} />
}
