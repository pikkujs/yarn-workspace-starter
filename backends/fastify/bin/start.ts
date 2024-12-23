import { VrameworkFastifyServer } from '@vramework/fastify'

import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import {
  createSingletonServices,
  createSessionServices,
} from '@vramework-workspace-starter/functions/src/services'

import '@vramework-workspace-starter/functions/.vramework/vramework-bootstrap'

async function main(): Promise<void> {
  try {
    const config = await createConfig()
    const singletonServices = await createSingletonServices(config)
    const appServer = new VrameworkFastifyServer(
      config,
      singletonServices,
      createSessionServices
    )
    appServer.enableExitOnSigInt()
    await appServer.init()
    await appServer.start()
  } catch (e: any) {
    console.error(e.toString())
    process.exit(1)
  }
}

main()
