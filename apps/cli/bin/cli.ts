import { websocket } from './websocket'
import { fetch } from './fetch'

const main = async () => {
    if (process.argv.includes('--websocket')) {
        let websockets: Array<Promise<void>> = []
        for (let i = 0; i < 3; i++) {
            websockets.push(new Promise<void>(resolve => websocket(resolve)))
        }
    }

    if (process.argv.includes('--fetch')) {
        await fetch()
    }
}

main()