import { VrameworkExpressServer } from '@vramework/express'

import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import {
  createSingletonServices,
  createSessionServices,
} from '@vramework-workspace-starter/functions/src/services'
import { VrameworkTaskScheduler } from '@vramework/schedule'

import '@vramework-workspace-starter/functions/.vramework/vramework-bootstrap'
import { ScheduledTaskNames } from '@vramework-workspace-starter/functions/.vramework/vramework-schedules.gen'

async function main(): Promise<void> {
  try {
    const config = await createConfig()
    const singletonServices = await createSingletonServices(config)

    const appServer = new VrameworkExpressServer(
      config,
      singletonServices,
      createSessionServices
    )
    appServer.enableExitOnSigInt()
    await appServer.init()
    await appServer.start()

    const scheduler = new VrameworkTaskScheduler<ScheduledTaskNames>(
      singletonServices
    )
    scheduler.startAll()
  } catch (e: any) {
    console.error(e.toString())
    process.exit(1)
  }
}

main()
