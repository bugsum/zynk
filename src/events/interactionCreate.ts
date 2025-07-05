import { createEvent } from "../handlers/eventHandler";
import { logger, safeReply } from "../lib/utils";
import { MessageFlags } from "discord.js";
import { getGuildConfig } from "../database/repositories/guildConfigRepo";
import { GiveawaysDB, AltsDB, InvitesDB } from "../database/adapters/jsondb";
import { Giveaway } from "../lib/types/interfaces";
import { ButtonInteraction } from "discord.js";

export default createEvent({
    name: "interactionCreate",
    listener: async (client, interaction) => {
        if (interaction.isAutocomplete()) {
            const commandName = interaction.commandName;
            const command = client.commandMap.get(commandName);
            if (command && typeof command.autocomplete === "function") {
                try {
                    await command.autocomplete(client, interaction);
                } catch (error) {
                    logger.error(error);
                }
            } else {
                // No autocomplete handler, respond with empty
                await interaction.respond([]);
            }
            return;
        }
        if (interaction.isChatInputCommand()) {
            try {
                const commandName = interaction.commandName;
                const guildId = interaction.guildId;
                if (guildId) {
                    const guildConfig = await getGuildConfig(guildId);
                    if (
                        guildConfig.customCommands &&
                        guildConfig.customCommands[commandName]
                    ) {
                        return interaction.reply(
                            guildConfig.customCommands[commandName],
                        );
                    }
                }

                const command = client.commandMap.get(commandName);

                if (!command) {
                    interaction.reply({
                        content: "No command found with that name",
                        flags: [MessageFlags.Ephemeral],
                    });
                }

                command?.interact(client, interaction);
            } catch (error) {
                logger.error(error);
                return safeReply(interaction, {
                    content: "An error occurred while executing this command.",
                    flags: [MessageFlags.Ephemeral],
                });
            }
        }
        if (interaction.isButton()) {
            const [action, giveawayId] = interaction.customId.split(":");
            if (action === "join_giveaway") {
                const guildId = interaction.guildId!;
                const userId = interaction.user.id;
                const db = await GiveawaysDB.get();
                const g = db[guildId]?.find((g) => g.id === giveawayId);
                if (!g || g.ended)
                    return interaction.reply({
                        content: "Giveaway not found or ended.",
                        ephemeral: true,
                    });
                // Check requirements
                let eligible = true;
                let reason = "";
                if (g.requirements.minInvites) {
                    const invitesDb = await InvitesDB.get();
                    const invites =
                        invitesDb[guildId]
                            ?.filter((i) => i.inviterId === userId)
                            .reduce((a, b) => a + b.uses, 0) || 0;
                    if (invites < g.requirements.minInvites) {
                        eligible = false;
                        reason = `You need at least ${g.requirements.minInvites} invites. You have ${invites}.`;
                    }
                }
                if (g.requirements.noAlts) {
                    const altsDb = await AltsDB.get();
                    if (altsDb[guildId]?.some((a) => a.userId === userId)) {
                        eligible = false;
                        reason = "You are flagged as an alt and cannot join.";
                    }
                }
                if (!eligible)
                    return interaction.reply({
                        content: reason,
                        ephemeral: true,
                    });
                if (g.entries.some((e) => e.userId === userId))
                    return interaction.reply({
                        content: "You already joined!",
                        ephemeral: true,
                    });
                g.entries.push({ userId, joinedAt: Date.now() });
                await GiveawaysDB.set(db);
                return interaction.reply({
                    content: "You have joined the giveaway!",
                    ephemeral: true,
                });
            }
        }
    },
});
