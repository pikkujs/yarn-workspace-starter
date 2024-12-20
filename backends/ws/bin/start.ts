import { vrameworkWebsocketHandler } from '@vramework/ws'
import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import { createSessionServices, createSingletonServices } from '@vramework-workspace-starter/functions/src/services'

import '@vramework-workspace-starter/functions/.vramework/vramework-bootstrap'
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

    // Add /health-check endpoint
    server.on('request', (req, res) => {
      if (req.method === 'GET' && req.url === '/health-check') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok' }))
      }
    })

    server.listen(config.port, config.hostname, () => {
      console.log(`Server running at http://${config.hostname}:${config.port}/`)
    })
  } catch (e: any) {
    console.error(e.toString())
    process.exit(1)
  }
}

main()
