import { Command } from 'commander'

import { getVrameworkCLIConfig } from '@vramework/core/vramework-cli-config'
import { VrameworkUWSServer } from '@vramework/deploy-uws'

import { config } from '@todos/functions/src/config'
import { createSessionServices, createSingletonServices } from '@todos/functions/src/services'

import '@todos/functions/generated/routes'
import '@todos/functions/generated/schemas'

async function action({ configFile }: { configFile?: string }): Promise<void> {
  try {
    const vrameworkConfig = await getVrameworkCLIConfig(configFile)
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
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
