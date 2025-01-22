import { ScheduledHandler } from 'aws-lambda'
import '@vramework-workspace-starter/functions/.vramework/vramework-schedules.gen'

import { runScheduledTask } from '@vramework/core/scheduler'
import { coldStart } from './cold-start.js'

export const expireTodos: ScheduledHandler = async (event) => {
  const singletonServices = await coldStart()
  await runScheduledTask({
    name: 'expireTodos',
    singletonServices,
  })
}
