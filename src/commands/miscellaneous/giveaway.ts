import { createCommand } from "../../handlers/commandHandler";
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { GiveawaysDB, AltsDB, InvitesDB } from "../../database/adapters/jsondb";
import {
    Giveaway,
    GiveawayRequirement,
    GiveawayEntry,
} from "../../lib/types/interfaces";
import { v4 as uuidv4 } from "uuid";

export default createCommand({
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Manage advanced giveaways with requirements.")
        .addSubcommand((sub) =>
            sub
                .setName("start")
                .setDescription("Start a new giveaway.")
                .addStringOption((opt) =>
                    opt
                        .setName("prize")
                        .setDescription("Prize for the giveaway")
                        .setRequired(true),
                )
                .addIntegerOption((opt) =>
                    opt
                        .setName("duration")
                        .setDescription("Duration in minutes")
                        .setRequired(true),
                )
                .addIntegerOption((opt) =>
                    opt
                        .setName("mininvites")
                        .setDescription("Minimum invites required to join"),
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName("noalts")
                        .setDescription("Disallow flagged alts from joining"),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("end")
                .setDescription("End an ongoing giveaway.")
                .addStringOption((opt) =>
                    opt
                        .setName("id")
                        .setDescription("Giveaway ID")
                        .setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("reroll")
                .setDescription("Reroll a giveaway winner.")
                .addStringOption((opt) =>
                    opt
                        .setName("id")
                        .setDescription("Giveaway ID")
                        .setRequired(true),
                ),
        ),
    interact: async (client, interaction: ChatInputCommandInteraction) => {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId!;
        const channelId = interaction.channelId;
        if (sub === "start") {
            const prize = interaction.options.getString("prize", true);
            const duration = interaction.options.getInteger("duration", true);
            const minInvites =
                interaction.options.getInteger("mininvites") || 0;
            const noAlts = interaction.options.getBoolean("noalts") || false;
            const endTime = Date.now() + duration * 60 * 1000;
            const id = uuidv4();
            const giveaway: Giveaway = {
                id,
                guildId,
                channelId,
                messageId: "",
                prize,
                endTime,
                requirements: { minInvites, noAlts },
                entries: [],
                winnerIds: [],
                ended: false,
            };
            await GiveawaysDB.update((db) => {
                if (!db[guildId]) db[guildId] = [];
                db[guildId].push(giveaway);
                return db;
            });
            const embed = new EmbedBuilder()
                .setTitle("🎉 Giveaway Started!")
                .setDescription(
                    `Prize: **${prize}**\nEnds in: **${duration}** minutes\nRequirements: ${minInvites > 0 ? `\n- At least ${minInvites} invites` : ""}${noAlts ? "\n- No flagged alts" : ""}`,
                )
                .setFooter({ text: `Giveaway ID: ${id}` })
                .setTimestamp(endTime);
            const joinButton =
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`join_giveaway:${id}`)
                        .setLabel("Join Giveaway")
                        .setStyle(ButtonStyle.Primary),
                );
            const msg = await interaction.reply({
                embeds: [embed],
                components: [joinButton],
                fetchReply: true,
            });
            await GiveawaysDB.update((db) => {
                const g = db[guildId].find((g) => g.id === id);
                if (g) g.messageId = msg.id;
                return db;
            });
        } else if (sub === "end") {
            const id = interaction.options.getString("id", true);
            const db = await GiveawaysDB.get();
            const g = db[guildId]?.find((g) => g.id === id);
            if (!g || g.ended)
                return interaction.reply({
                    content: "Giveaway not found or already ended.",
                    ephemeral: true,
                });
            g.ended = true;
            // Pick winner(s)
            const eligible = g.entries;
            if (eligible.length === 0)
                return interaction.reply({
                    content: "No eligible entries.",
                    ephemeral: true,
                });
            const winner =
                eligible[Math.floor(Math.random() * eligible.length)].userId;
            g.winnerIds = [winner];
            await GiveawaysDB.set(db);
            await interaction.reply({
                content: `Giveaway ended! Winner: <@${winner}>`,
            });
        } else if (sub === "reroll") {
            const id = interaction.options.getString("id", true);
            const db = await GiveawaysDB.get();
            const g = db[guildId]?.find((g) => g.id === id);
            if (!g || !g.ended || g.entries.length === 0)
                return interaction.reply({
                    content: "Giveaway not found, not ended, or no entries.",
                    ephemeral: true,
                });
            const winner =
                g.entries[Math.floor(Math.random() * g.entries.length)].userId;
            g.winnerIds = [winner];
            await GiveawaysDB.set(db);
            await interaction.reply({
                content: `Rerolled! New winner: <@${winner}>`,
            });
        }
    },
});
