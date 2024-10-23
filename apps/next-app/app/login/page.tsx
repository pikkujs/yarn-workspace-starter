import { vramework } from '@/vramework-nextjs'
import { Login } from '@todos/components/Login'

async function login(name: string) {
  'use server'
  const result =await vramework().actionRequest(
    '/login',
    'post',
    { name }
  )
}

export default function LoginPage() {
  return <Login login={login} />
}
