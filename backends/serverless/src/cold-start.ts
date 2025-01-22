
import { createConfig } from '@vramework-workspace-starter/functions/src/config'
import { createSingletonServices } from '@vramework-workspace-starter/functions/src/services'
import {
  Config,
  SingletonServices,
} from '@vramework-workspace-starter/functions/src/application-types'
import { AWSSecrets } from '@vramework/aws-services'
import { LocalVariablesService } from '@vramework/core'

let config: Config
let singletonServices: SingletonServices

export const coldStart = async () => {
  if (!config) {
    config = await createConfig()
  }
  if (!singletonServices) {
    singletonServices = await createSingletonServices(
      config,
      {
        secretServce: new AWSSecrets(config),
      }
    )
  }
  return singletonServices
}
