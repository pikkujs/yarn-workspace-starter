import { JsonValue } from "@vramework-workspace-starter/sdk/generated/db-pure";
import { CoreUserSession } from "@vramework/core";
import { Channel, ChannelStore } from "@vramework/core/channel";
import { Kysely } from "kysely";
import { DB } from "kysely-codegen";

export class KyselyChannelStore extends ChannelStore {
    constructor (private database: Kysely<DB>) {
        super()
    }

    public async addChannel({ channelId, channelName, openingData }: Channel): Promise<void> {
        await this.database
            .insertInto('serverless.lambdaChannels')
            .values({
                channelId,
                channelName,
                openingData: openingData as any
            })
            .execute()
    }

    public async removeChannels(channelIds: string[]): Promise<void> {
        await this.database
            .deleteFrom('serverless.lambdaChannels')
            .where('channelId', 'in', channelIds)
            .execute()
    }

    public async setUserSession(channelId: string, session: JsonValue): Promise<void> {
        await this.database
            .updateTable('serverless.lambdaChannels')
            .where('channelId', '=', channelId)
            .set('userSession', session)
            .executeTakeFirstOrThrow()
    }

    public async getChannel (channelId: string) {
        const result = await this.database
            .selectFrom('serverless.lambdaChannels')
            .selectAll()
            .where('channelId', '=', channelId)
            .executeTakeFirstOrThrow()
        return {
            openingData: result.openingData as any,
            userSession: result.userSession as CoreUserSession,
            channelName: result.channelName
        } as Channel
    }
}