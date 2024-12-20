import { vramework } from '@/vramework-nextjs'
import { Login } from '@vramework-workspace-starter/components/Login'

async function login(name: string) {
  'use server'
  await vramework().actionRequest(
    '/login',
    'post',
    { name }
  )
}

export default function LoginPage() {
  return <Login login={login} />
}
