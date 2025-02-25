import { createConfig } from '@pikku-workspace-starter/functions/src/config';
import { createSingletonServices } from '@pikku-workspace-starter/functions/src/services';
import { LocalVariablesService, LocalSecretService } from '@pikku/core/services';

export const setupServices = async (env: Record<string, string | undefined>) => {
	const localVariables = new LocalVariablesService(env);
	const config = await createConfig(localVariables);
	const localSecrets = new LocalSecretService(localVariables);
	return await createSingletonServices(config, { variablesService: localVariables, secretServce: localSecrets });
};
