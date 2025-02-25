import { Login } from '@/components/Login'
import { pikku} from '@/pikku-nextjs.gen'
import { redirect } from 'next/navigation'

async function login(name: string) {
  'use server'
  await pikku().post('/login', { name })
  redirect('/todos')
}

export default function LoginPage() {
  return <Login login={login} />
}
