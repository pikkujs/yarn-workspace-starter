import { VrameworkFastifyServer } from '@vramework/fastify'

import { config } from '@todos/functions/src/config'
import { createSingletonServices, createSessionServices } from '@todos/functions/src/services'

import '@todos/functions/.vramework/routes'
import '@todos/functions/.vramework/schemas'

async function main(): Promise<void> {
  try {
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