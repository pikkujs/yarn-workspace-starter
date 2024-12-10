import { websocket } from './websocket'
import { fetch } from './fetch'

const main = async () => {
    if (process.argv.includes('--websocket')) {
        for (let i = 0; i < 1; i++) {
            await new Promise<void>(resolve => websocket(resolve))
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }

    if (process.argv.includes('--fetch')) {
        await fetch()
    }
}

main()