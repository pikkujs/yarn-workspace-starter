import { websocket } from './websocket.js'
import { fetch } from './fetch.js'

const main = async () => {
  let apiKey: string | undefined
  let serverUrl = 'http://localhost:4002'
  let wsUrl = 'ws://localhost:4002'

  if (process.argv.includes('--url')) {
    serverUrl = process.argv[process.argv.indexOf('--url') + 1]
    wsUrl = serverUrl.replace('http', 'ws')
  }

  if (process.argv.includes('--apikey')) {
    apiKey = 'top-secret-api-key'
  }

  console.log('Server URL:', serverUrl)

  if (process.argv.includes('--websocket')) {
    let websockets: Array<Promise<void>> = []
    for (let i = 0; i < 3; i++) {
      websockets.push(
        new Promise<void>((resolve) =>
          websocket(wsUrl, apiKey, `user-${i}`, resolve)
        )
      )
    }
  }

  if (process.argv.includes('--fetch')) {
    await fetch(serverUrl, apiKey)
  }
}

main()
