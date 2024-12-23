
import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import { createSingletonServices } from '@vramework-workspace-starter/functions/src/services'
import {
  Config,
  SingletonServices,
} from '@vramework-workspace-starter/functions/types/application-types'
import { AWSSecrets } from '@vramework/aws-services'

let config: Config
let singletonServices: SingletonServices

export const coldStart = async () => {
  if (!config) {
    config = await createConfig()
  }
  if (!singletonServices) {
    singletonServices = await createSingletonServices(
      config,
      new AWSSecrets(config)
    )
  }
  return singletonServices
}
