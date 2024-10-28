import { VrameworkExpressServer } from '@vramework/express'

import { config } from '@todos/functions/src/config'
import { createSingletonServices, createSessionServices } from '@todos/functions/src/services'

import '@todos/functions/.vramework/vramework-bootstrap'

async function main(): Promise<void> {
  try {
    const singletonServices = await createSingletonServices(config)

    const appServer = new VrameworkExpressServer(
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