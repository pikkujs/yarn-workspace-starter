import { CloudflareWebSocketHibernationServer } from "@vramework/cloudflare";
import { setupServices } from "./setup-services";
import { createSessionServices } from "@vramework-workspace-starter/functions/src/services";
import { SingletonServices } from "@vramework-workspace-starter/functions/types/application-types";
import { CloudflareEventHubService } from "node_modules/@vramework/cloudflare/src/cloudflare-eventhub-service";

export class WebSocketHibernationServer extends CloudflareWebSocketHibernationServer {
    private singletonServices: SingletonServices | undefined

    protected async getParams () {
        if (!this.singletonServices) {
            this.singletonServices = await setupServices(this.env)
            this.singletonServices.subscriptionService = new CloudflareEventHubService(this.singletonServices.logger, this.ctx)
        }
        return {
            singletonServices: this.singletonServices,
            createSessionServices
        }
    }
} 