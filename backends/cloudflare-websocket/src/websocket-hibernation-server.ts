import { CloudflareWebSocketHibernationServer } from '@pikku/cloudflare';
import { setupServices } from './setup-services.js';
import { createSessionServices } from '@pikku-workspace-starter/functions/src/services';
import { SingletonServices } from '@pikku-workspace-starter/functions/src/application-types.d';
import { CloudflareEventHubService } from '@pikku/cloudflare';

export class WebSocketHibernationServer extends CloudflareWebSocketHibernationServer {
	private singletonServices: SingletonServices | undefined;

	protected async getParams() {
		if (!this.singletonServices) {
			this.singletonServices = await setupServices(this.env);
			this.singletonServices.eventHub = new CloudflareEventHubService(this.singletonServices.logger, this.ctx);
		}
		return {
			singletonServices: this.singletonServices,
			createSessionServices,
		};
	}
}
