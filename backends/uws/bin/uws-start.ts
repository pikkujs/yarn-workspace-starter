import { Command } from 'commander'

import { CreateSessionServices } from '@vramework/core'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import { VrameworkUWSServer } from '@vramework/deploy-uws'

import { config } from '@todos/functions/src/config'
import { createSingletonServices } from '@todos/functions/src/services'

export const createSessionServices: CreateSessionServices = async (
  singletonServices,
  _session
) => {
  return {
    ...singletonServices,
  }
}

async function action({ configFile }: { configFile?: string }): Promise<void> {
  try {
    const vrameworkConfig = await getVrameworkConfig(configFile)
    const singletonServices = await createSingletonServices(config)
    const appServer = new VrameworkUWSServer(
      vrameworkConfig,
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

export const start = (program: Command): void => {
  program
    .command('start')
    .description('start the express server')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}
