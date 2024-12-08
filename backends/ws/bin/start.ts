import { vrameworkWebsocketHandler } from '@vramework/ws'
import { createConfig } from '@todos/functions/src/config'
import { createSessionServices, createSingletonServices } from '@todos/functions/src/services'

import '@todos/functions/.vramework/vramework-bootstrap'
import { Server } from 'http'
import { WebSocketServer } from 'ws'

async function main(): Promise<void> {
  try {
    const config = await createConfig()
    const singletonServices = await createSingletonServices(config)
    const server = new Server()
    const wss = new WebSocketServer({ noServer: true })
    vrameworkWebsocketHandler({
      server,
      wss,
      singletonServices,
      createSessionServices
    })
    server.listen(config.port, config.hostname)
  } catch (e: any) {
    console.error(e.toString())
    process.exit(1)
  }
}

main()
