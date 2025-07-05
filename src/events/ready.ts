import { createEvent } from "../handlers/eventHandler";
import { logger } from "../lib/utils";
import {
    ActivityType,
    PermissionsBitField,
    TextChannel,
    Client,
    Guild,
} from "discord.js";
import { InvitesDB } from "../database/adapters/jsondb";
import { Invite } from "../lib/types/interfaces";

async function cacheInvites(client: Client) {
    for (const guild of client.guilds.cache.values()) {
        let invitesArr: Invite[] = [];
        try {
            const invites = await guild.invites.fetch();
            invitesArr = invites.map((invite) => ({
                code: invite.code,
                inviterId: invite.inviter?.id || "unknown",
                uses: invite.uses || 0,
                createdAt: invite.createdTimestamp || Date.now(),
                guildId: guild.id,
            }));
        } catch {
            invitesArr = [];
        }
        await InvitesDB.update((db) => {
            db[guild.id] = invitesArr;
            return db;
        });
    }
}

export default createEvent({
    name: "ready",
    runOnce: true,
    async listener(client) {
        logger.info(`${client.user?.username} is ready!`);
        await cacheInvites(client);
    },
});
