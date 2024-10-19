import { vramework } from '@/generated/vramework-nextjs'
import { Login } from '@todos/components/Login'

async function login(name: string) {
  'use server'
  const bob = await vramework().actionRequest(
    '/login',
    'post',
    { name }
  )
}

export default function LoginPage() {
  return <Login login={login} />
}
