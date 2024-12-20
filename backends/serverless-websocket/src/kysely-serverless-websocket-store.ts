import { JsonValue } from "@vramework-workspace-starter/sdk/generated/db-pure";
import { CoreUserSession } from "@vramework/core";
import { ServerlessChannelStore } from "@vramework/core/channel/serverless";
import { Kysely } from "kysely";
import { DB } from "kysely-codegen";

export class KyselyWebsocketStore extends ServerlessChannelStore {
    constructor (private database: Kysely<DB>) {
        super()
    }

    public async addChannel(channelId: string, channelName: string): Promise<void> {
        await this.database
            .insertInto('serverless.lambdaChannels')
            .values({
                channelId,
                channelName
            })
            .execute()
    }

    public async removeChannels(channelIds: string[]): Promise<void> {
        await this.database
            .deleteFrom('serverless.lambdaChannels')
            .where('channelId', 'in', channelIds)
            .execute()
    }

    public async setSession(channelId: string, session: JsonValue): Promise<void> {
        await this.database
            .updateTable('serverless.lambdaChannels')
            .where('channelId', '=', channelId)
            .set('userSession', session)
            .executeTakeFirstOrThrow()
    }

    public async setLastInteraction(channelId: string, lastPing: Date): Promise<void> {
        await this.database
            .updateTable('serverless.lambdaChannels')
            .where('channelId', '=', channelId)
            .set('lastInteraction', lastPing)
            .executeTakeFirstOrThrow()
    }

    public async getData (channelId: string) {
        const result = await this.database
            .selectFrom('serverless.lambdaChannels')
            .selectAll()
            .where('channelId', '=', channelId)
            .executeTakeFirstOrThrow()
        return {
            openingData: result.openingData as any,
            userSession: result.userSession as CoreUserSession,
            name: result.channelName
        }
    }

    public async getAllChannelIds(): Promise<string[]> {
        const result = await this.database
            .selectFrom('serverless.lambdaChannels')
            .select('channelId')
            .execute()
        return result.map((row) => row.channelId)
    }

    public async getChannelIdsForTopic(topic: string): Promise<string[]> {
        const result = await this.database
            .selectFrom('serverless.lambdaChannelSubscriptions')
            .select('channelId')
            .where('topic', '=', topic)
            .execute()
        return result.map((row) => row.channelId)
    }

    public async subscribe(topic: string, channelId: string): Promise<boolean> {
        await this.database
            .insertInto('serverless.lambdaChannelSubscriptions')
            .values({ channelId, topic })
            .execute()
        return true
    }

    public async unsubscribe(topic: string, channelId: string): Promise<boolean> {
        await this.database
            .deleteFrom('serverless.lambdaChannelSubscriptions')
            .where('channelId', '=', channelId)
            .where('topic', '=', topic)
            .execute()
        return true
    }
}