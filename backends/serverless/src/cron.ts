
import { ScheduledHandler } from 'aws-lambda'

import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import { createSingletonServices } from '@vramework-workspace-starter/functions/src/services'

import '@vramework-workspace-starter/functions/.vramework/vramework-schedules'
import { AWSSecrets } from '@vramework/aws-services'

import { Config, SingletonServices } from '@vramework-workspace-starter/functions/types/application-types'
import { runScheduledTask } from '@vramework/core/scheduler'

let config: Config
let singletonServices: SingletonServices

const coldStart = async () => {
    if (!config) {
        config = await createConfig()
    }
    if (!singletonServices) {
      singletonServices = await createSingletonServices(config, new AWSSecrets(config))
    }
}

export const expireTodos: ScheduledHandler = async (event) => {
  await coldStart()
  await runScheduledTask({
    name: 'expireTodos',
    singletonServices,
  })
}
