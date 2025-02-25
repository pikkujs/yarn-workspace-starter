import { PikkuExpressServer } from '@pikku/express'

import { createConfig } from '@pikku-workspace-starter/functions/src/config'
import {
  createSingletonServices,
  createSessionServices,
} from '@pikku-workspace-starter/functions/src/services'
import { PikkuTaskScheduler } from '@pikku/schedule'

import '@pikku-workspace-starter/functions/.pikku/pikku-bootstrap.gen'
import { ScheduledTaskNames } from '@pikku-workspace-starter/functions/.pikku/pikku-schedules.gen'

async function main(): Promise<void> {
  try {
    const config = await createConfig()
    const singletonServices = await createSingletonServices(config)

    const appServer = new PikkuExpressServer(
      config,
      singletonServices,
      createSessionServices
    )
    appServer.enableExitOnSigInt()
    await appServer.init()
    await appServer.start()

    const scheduler = new PikkuTaskScheduler<ScheduledTaskNames>(
      singletonServices
    )
    scheduler.startAll()
  } catch (e: any) {
    console.error(e.toString())
    process.exit(1)
  }
}

main()
