import { Login } from "@todos/components/Login"
import { useRouter } from "next/router";
import { useCallback } from "react";

export default function LoginPage() {
    const router = useRouter()

    const login = useCallback(async (name: string) => {
        await fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ name }),
        })
        await router.replace('/todos')
    }, [])

    return (
        <Login login={login} />
    );
}
