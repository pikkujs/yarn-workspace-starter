import { Login } from '@todos/components/Login'
import { vramework } from '../../vramework'

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
