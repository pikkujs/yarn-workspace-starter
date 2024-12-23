import { ScheduledHandler } from 'aws-lambda'
import '@vramework-workspace-starter/functions/.vramework/vramework-schedules'

import { runScheduledTask } from '@vramework/core/scheduler'
import { coldStart } from './cold-start'

export const expireTodos: ScheduledHandler = async (event) => {
  const singletonServices = await coldStart()
  await runScheduledTask({
    name: 'expireTodos',
    singletonServices,
  })
}
