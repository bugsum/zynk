import { createCommand } from "../../handlers/commandHandler";
import { safeReply, safeUpdate, logger } from "../../lib/utils";
import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    Message,
    ActionRow,
    MessageActionRowComponent,
} from "discord.js";
import {
    getGuildConfig,
    updateGuildConfig,
    type GuildConfig,
} from "../../database/guildConfig";

const WELCOME_PREFIX = "welcome-setup-";

type WelcomeConfig = GuildConfig["features"]["welcome"];

function getSetupRows(welcome: WelcomeConfig) {
    return [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(WELCOME_PREFIX + "toggle")
                .setLabel(welcome.enabled ? "Disable" : "Enable")
                .setStyle(
                    welcome.enabled ? ButtonStyle.Danger : ButtonStyle.Success,
                ),
            new ButtonBuilder()
                .setCustomId(WELCOME_PREFIX + "message")
                .setLabel("Customize Message")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(WELCOME_PREFIX + "cancel")
                .setLabel("Cancel Setup")
                .setStyle(ButtonStyle.Secondary),
        ),
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId(WELCOME_PREFIX + "channel")
                .setPlaceholder("Select a welcome channel")
                .addChannelTypes(ChannelType.GuildText),
        ),
    ];
}

function configSummary(welcome: WelcomeConfig) {
    return `**Welcome Setup**\nCurrent config:\n\`\`\`json\n${JSON.stringify(welcome, null, 2)}\n\`\`\`\n- Use the buttons below to configure the welcome feature.`;
}

// Helper to disable all components in a message
async function disableAllComponents(msg: Message) {
    try {
        // If the message is not editable (e.g., ephemeral and dismissed), skip
        if (!msg.editable) return;
        const rows = msg.components;
        rows.forEach((row: ActionRow<MessageActionRowComponent>) =>
            row.components.forEach((c: any) => c.setDisabled(true)),
        );
        await msg.edit({ components: rows });
    } catch (err: any) {
        // Ignore unknown message or deleted message errors
        if (
            err.message?.includes("Unknown Message") ||
            err.message?.includes("deleted")
        ) {
            logger.warn(
                "[Welcome Setup] Tried to edit a deleted or unknown message.",
            );
            return;
        }
        logger.error("[Welcome Setup] Failed to disable components", err);
    }
}

export default createCommand({
    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Administer the welcome feature.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) =>
            sub
                .setName("preview")
                .setDescription(
                    "Preview the welcome message as if a member joined.",
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("setup")
                .setDescription("Setup the welcome feature interactively."),
        ),
    async interact(client, interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            await safeReply(interaction, {
                content: "Use this in a server.",
                ephemeral: true,
            });
            return;
        }
        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();

        // Preview subcommand: emit a fake guildMemberAdd event
        if (sub === "preview") {
            const member = interaction.guild?.members.cache.get(
                interaction.user.id,
            );
            if (!member) {
                await safeReply(interaction, {
                    content: "Could not find your member object.",
                    ephemeral: true,
                });
                return;
            }
            await safeReply(interaction, {
                content: "Previewing welcome message...",
                ephemeral: true,
            });
            client.emit("guildMemberAdd", member);
            return;
        }

        // Setup wizard subcommand
        if (sub === "setup") {
            let config: GuildConfig = await getGuildConfig(guildId);
            let welcome: WelcomeConfig = config.features.welcome;
            await safeReply(interaction, {
                content: configSummary(welcome),
                components: getSetupRows(welcome),
                // ephemeral: true,
            });
            const msg = (await interaction.fetchReply()) as Message;
            let finished = false;
            while (!finished) {
                try {
                    const i = await msg.awaitMessageComponent({
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 1 * 10_000,
                    });
                    config = await getGuildConfig(guildId);
                    welcome = config.features.welcome;
                    // Toggle enable/disable
                    if (
                        i.isButton() &&
                        i.customId === WELCOME_PREFIX + "toggle"
                    ) {
                        const newEnabled = !welcome.enabled;
                        await updateGuildConfig(guildId, (cfg) => ({
                            ...cfg,
                            features: {
                                ...cfg.features,
                                welcome: {
                                    ...cfg.features.welcome,
                                    enabled: newEnabled,
                                },
                            },
                        }));
                        await safeUpdate(i, {
                            content: configSummary({
                                ...welcome,
                                enabled: newEnabled,
                            }),
                            components: getSetupRows({
                                ...welcome,
                                enabled: newEnabled,
                            }),
                        });
                        continue;
                    }
                    // Customize message
                    if (
                        i.isButton() &&
                        i.customId === WELCOME_PREFIX + "message"
                    ) {
                        const modal = new ModalBuilder()
                            .setCustomId(WELCOME_PREFIX + "message-modal")
                            .setTitle("Customize Welcome Message")
                            .addComponents(
                                new ActionRowBuilder<TextInputBuilder>().addComponents(
                                    new TextInputBuilder()
                                        .setCustomId("welcome-message-input")
                                        .setLabel("Welcome Message")
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setValue(welcome.message),
                                ),
                            );
                        await i.showModal(modal);
                        const modalSubmit = await i.awaitModalSubmit({
                            time: 60_000,
                        });
                        const message = modalSubmit.fields.getTextInputValue(
                            "welcome-message-input",
                        );
                        await updateGuildConfig(guildId, (cfg) => ({
                            ...cfg,
                            features: {
                                ...cfg.features,
                                welcome: { ...cfg.features.welcome, message },
                            },
                        }));
                        await safeReply(modalSubmit, {
                            content: "Welcome message updated!",
                            ephemeral: true,
                        });
                        // Refresh main message
                        config = await getGuildConfig(guildId);
                        welcome = config.features.welcome;
                        await msg.edit({
                            content: configSummary(welcome),
                            components: getSetupRows(welcome),
                        });
                        continue;
                    }
                    // Channel selection
                    if (
                        i.isChannelSelectMenu() &&
                        i.customId === WELCOME_PREFIX + "channel"
                    ) {
                        const channelId = i.values[0];
                        await updateGuildConfig(guildId, (cfg) => ({
                            ...cfg,
                            features: {
                                ...cfg.features,
                                welcome: { ...cfg.features.welcome, channelId },
                            },
                        }));
                        await safeUpdate(i, {
                            content: configSummary({ ...welcome, channelId }),
                            components: getSetupRows({ ...welcome, channelId }),
                        });
                        continue;
                    }
                    // Cancel
                    if (
                        i.isButton() &&
                        i.customId === WELCOME_PREFIX + "cancel"
                    ) {
                        await safeUpdate(i, {
                            content: `Welcome setup cancelled.`,
                            components: [],
                        });
                        finished = true;
                        break;
                    }
                } catch (err: any) {
                    if (
                        err.code === "InteractionCollectorError" ||
                        err.message?.includes("time")
                    ) {
                        await msg.edit({
                            content: `Setup timed out. Please run /welcome setup again if needed.`,
                            components: getSetupRows(welcome).map((row) => {
                                row.components.forEach((c: any) =>
                                    c.setDisabled(true),
                                );
                                return row;
                            }),
                        });
                        finished = true;
                        break;
                    }
                    logger.error(
                        "[Welcome Setup Await] Error in component handler",
                        err,
                    );
                    await safeReply(interaction, {
                        content: "An error occurred. Please try again.",
                        ephemeral: true,
                    });
                    finished = true;
                    break;
                }
            }
            // Always disable components after finish/timeout/error
            await disableAllComponents(msg);
        }
    },
});
