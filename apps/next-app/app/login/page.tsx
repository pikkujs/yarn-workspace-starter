import { redirect } from 'next/navigation'

export default function LoginPage() {
  // Redirect to main restaurant page which handles login
  redirect('/restaurant')
}