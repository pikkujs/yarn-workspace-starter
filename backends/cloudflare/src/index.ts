import { runFetch, runScheduled } from '@vramework/cloudflare';
import { createSessionServices } from '@vramework-workspace-starter/functions/src/services'

import '@vramework-workspace-starter/functions/.vramework/vramework-bootstrap'
import { setupServices } from './setup-services';

export { WebSocketHibernationServer } from './websocket-hibernation-server'

export default {
	async scheduled(controller, env, ctx) {
		const singletonServices = await setupServices(env)
		await runScheduled(controller, singletonServices)
	},

	async fetch(request, env, ctx): Promise<Response> {
		const singletonServices = await setupServices(env)
		const websocketServerDurableObject: any = singletonServices.variablesService.get('WEBSOCKET_HIBERNATION_SERVER')
		const id = websocketServerDurableObject.idFromName("foo");
		const webSocketHibernationServer = websocketServerDurableObject.get(id);

		return await runFetch(
			request,
			singletonServices,
			createSessionServices,
			webSocketHibernationServer
		)
	},
} satisfies ExportedHandler<Record<string, string>>;
