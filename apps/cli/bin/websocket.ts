import { VrameworkWebSocket } from "../vramework-websocket"

export const websocket = async (userName: string, onClose: () => void) => {
        let authenticationState: 'initial' | 'authenticated' | 'unauthenticated' = 'initial'
        const websocket = new VrameworkWebSocket<'events'>('ws://localhost:3001?name=bob')
        websocket.ws.onopen = async () => {
            console.log('Websocket connected')
            websocket.subscribe((data) => {
                console.log('Global global message:', data)
            })
            const route = websocket.getRoute('action')
            route.subscribe('subscribe', async (data) => {
                console.log(`From subsribe route: ${data}`)
            })
            route.subscribe('auth', async (data) => {
                console.log(`From auth route: ${data}`)
                if (data.authResult === true) {
                    console.log('User is authenticated')
                    authenticationState = 'authenticated'
                } else {
                    console.log('User is not authenticated')
                    authenticationState = 'unauthenticated'
                }
            })

            // Authenticate user
            route.send('auth', { token: 'valid', userName })

            // Wait for authentication to be validated
            while (authenticationState === 'initial') {
                await new Promise((resolve) => setTimeout(resolve, 100))
            }

            // Default handler
            websocket.send('hello')

            // Route handler
            route.send('subscribe', { name: 'test' })
            
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Publish to everyone
            route.send('emit', { name: 'test' })

            setTimeout(() => {
                websocket.ws.onclose = onClose
                websocket.ws.close()
            }, 5000)
        }
        websocket.ws.onerror = (e) => {
            console.error('Error with websocket', e)
        }
}
