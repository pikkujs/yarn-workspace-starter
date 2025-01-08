import { CloudflareWebSocketHibernationServer } from '@vramework/cloudflare';
import { setupServices } from './setup-services.js';
import { createSessionServices } from '@vramework-workspace-starter/functions/src/services';
import { SingletonServices } from '@vramework-workspace-starter/functions/types/application-types';
import { CloudflareEventHubService } from '@vramework/cloudflare';

export class WebSocketHibernationServer extends CloudflareWebSocketHibernationServer {
	private singletonServices: SingletonServices | undefined;

	protected async getParams() {
		if (!this.singletonServices) {
			this.singletonServices = await setupServices(this.env);
			this.singletonServices.subscriptionService = new CloudflareEventHubService(this.singletonServices.logger, this.ctx);
		}
		return {
			singletonServices: this.singletonServices,
			createSessionServices,
		};
	}
}
