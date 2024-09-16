import { Login } from "@todos/components/Login"
import { vramework } from "../../vramework"

async function login (name: string) {
  "use server"
  await vramework().actionRequest({
    type: 'post',
    route: '/login',
  }, { name })
}

export default function LoginPage () {
  return (
    <Login login={login} />
  );
}
