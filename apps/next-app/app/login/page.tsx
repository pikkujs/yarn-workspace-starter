import { Login } from '@/components/Login'
import { vramework } from '@/vramework-nextjs.gen'
import { redirect } from 'next/navigation'

async function login(name: string) {
  'use server'
  await vramework().post('/login', { name })
  redirect('/todos')
}

export default function LoginPage() {
  return <Login login={login} />
}
