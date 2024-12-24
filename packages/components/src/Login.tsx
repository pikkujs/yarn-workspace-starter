'use client'

import React, { FormEventHandler, PropsWithChildren, useCallback } from 'react'
import { TodoHeader } from './TodosCard'

export const Login: React.FunctionComponent<
  PropsWithChildren<{
    login: (name: string) => Promise<void>
  }>
> = ({ login }) => {
  const [name, setName] = React.useState('')

  const onSubmit = useCallback<FormEventHandler>(
    async (e) => {
      e.preventDefault()
      await login(name)
      setName('')
    },
    [name]
  )

  return (
    <div className="flex items-center justify-center w-screen h-screen font-medium">
      <div className="flex flex-grow items-center justify-center h-full bg-gray-100">
        <div className="max-w-full p-8 bg-white rounded-lg shadow-lg w-96">
          <TodoHeader />
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-2 items-center w-full px-2 mt-2 text-sm font-medium rounded"
          >
            <input
              className="w-full h-8 bg-transparent outline-none font-medium border rounded p-2"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="submit"
              className="py-1 rounded bg-blue-400 w-full text-white uppercase"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
