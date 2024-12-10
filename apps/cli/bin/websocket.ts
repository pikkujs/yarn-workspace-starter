import { VrameworkWebSocket } from "../vramework-websocket"

export const websocket = async (onClose: () => void) => {
        const websocket = new VrameworkWebSocket<'/event'>('ws://0.0.0.0:4002/event')
        websocket.ws.onopen = () => {
            const route = websocket.getRoute('action')
            route.send('auth', { token: 'valid' })

            console.error('Websocket opened')
            websocket.subscribe((data) => {
                console.log('got message:', data)
            })

            websocket.send('hello')
            route.subscribe('subscribe', async (data) => {
                console.log(data)
            })
            route.send('subscribe', { name: 'test' })
            
            setTimeout(() => {
                websocket.ws.onclose = onClose
                websocket.ws.close()
            }, 5000)
        }
        websocket.ws.onerror = (e) => {
            console.error('Error with websocket', e)
        }
}
