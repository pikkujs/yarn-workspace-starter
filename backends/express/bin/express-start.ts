import { Command } from 'commander'

import { 
  ExpressServer, 
  ExpressHTTPRequestService, 
  ExpressHTTPResponseService,
  CreateExpressHTTPSessionServices,
  getVrameworkConfig
} from '@vramework/deploy-express'

import { config } from '@bookbliss/functions/src/config'
import { createSingletonServices } from '@bookbliss/functions/src/services'

export const createSessionServices: CreateExpressHTTPSessionServices = async (singletonServices, _session, { req, res }) => {
  return {
    ...singletonServices,
    httpRequest: new ExpressHTTPRequestService(req as any),
    httpResponse: new ExpressHTTPResponseService(res as any)
  }
}

async function action({ configFile }: { configFile?: string }): Promise<void> {
  try {
    const vrameworkConfig = await getVrameworkConfig(configFile)
    const singletonServices = await createSingletonServices(config)
    const appServer = new ExpressServer(
      vrameworkConfig,
      config, 
      singletonServices,
      createSessionServices,
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