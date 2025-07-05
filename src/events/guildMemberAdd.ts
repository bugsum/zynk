import { createEvent } from "../handlers/eventHandler";
import { getGuildConfig } from "../database/guildConfig";
import { ChannelType, GuildMember, TextChannel } from "discord.js";
import { InvitesDB, AltsDB } from "../database/adapters/jsondb";
import { AltFlag } from "../lib/types/interfaces";

export default createEvent({
    name: "guildMemberAdd",
    async listener(client, member: GuildMember) {
        const guildId = member.guild.id;
        const config = await getGuildConfig(guildId);
        const welcome = config.features.welcome;
        if (!welcome.enabled) return;
        const channel = member.guild.channels.cache.get(
            welcome.channelId || "",
        ) as TextChannel | undefined;
        if (!channel || channel.type !== ChannelType.GuildText) return;
        const welcomeMsg = (welcome.message || "Welcome {user} to {guild}!")
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{guild}/g, member.guild.name);
        channel.send({ content: welcomeMsg });

        // Invite tracking (basic, for demonstration)
        // Discord does not provide direct invite used in member add, so this is a placeholder for custom logic
        // You may need to cache invites and compare before/after for real tracking
        // Alt detection: flag if account is < 7 days old
        if (
            member.user.createdTimestamp >
            Date.now() - 7 * 24 * 60 * 60 * 1000
        ) {
            await AltsDB.update((db) => {
                if (!db[guildId]) db[guildId] = [];
                db[guildId].push({
                    userId: member.id,
                    guildId,
                    reason: "Account too new",
                    flaggedAt: Date.now(),
                });
                return db;
            });
        }
    },
});
