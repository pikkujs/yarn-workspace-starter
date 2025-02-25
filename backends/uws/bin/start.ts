import { PikkuUWSServer } from '@pikku/uws'

import { createConfig } from '@pikku-workspace-starter/functions/src/config'
import {
  createSessionServices,
  createSingletonServices,
} from '@pikku-workspace-starter/functions/src/services'

import '@pikku-workspace-starter/functions/.pikku/pikku-bootstrap.gen'

async function main(): Promise<void> {
  try {
    const config = await createConfig()
    const singletonServices = await createSingletonServices(config)
    const appServer = new PikkuUWSServer(
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
