import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    AutocompleteInteraction,
} from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { createCommand } from "../../handlers/commandHandler";
import {
    getGuildConfig,
    setGuildConfig,
} from "../../database/repositories/guildConfigRepo";
import { env } from "../../lib/utils";
import type { Client } from "../../ochako";

const token = env("CLIENT_TOKEN");
const clientId = process.env.CLIENT_ID!;

const data = new SlashCommandBuilder()
    .setName("custom_command")
    .setDescription("Manage custom commands for this server (admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
        sub
            .setName("create")
            .setDescription("Create a new custom command.")
            .addStringOption((opt) =>
                opt
                    .setName("name")
                    .setDescription("Command name")
                    .setRequired(true),
            )
            .addStringOption((opt) =>
                opt
                    .setName("response")
                    .setDescription("Command response")
                    .setRequired(true),
            ),
    )
    .addSubcommand((sub) =>
        sub
            .setName("update")
            .setDescription("Update an existing custom command.")
            .addStringOption((opt) =>
                opt
                    .setName("name")
                    .setDescription("Command name")
                    .setRequired(true)
                    .setAutocomplete(true),
            )
            .addStringOption((opt) =>
                opt
                    .setName("response")
                    .setDescription("New command response")
                    .setRequired(true),
            ),
    )
    .addSubcommand((sub) =>
        sub
            .setName("delete")
            .setDescription("Delete a custom command.")
            .addStringOption((opt) =>
                opt
                    .setName("name")
                    .setDescription("Command name")
                    .setRequired(true)
                    .setAutocomplete(true),
            ),
    );

export default createCommand({
    data,
    async interact(_client: Client, interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand();
        const name = interaction.options.getString("name", true).toLowerCase();
        const guildId = interaction.guildId;
        if (!guildId) {
            return interaction.reply({
                content: "This command can only be used in a server.",
                ephemeral: true,
            });
        }
        let guildConfig = await getGuildConfig(guildId);
        const rest = new REST({ version: "10" }).setToken(token);
        if (sub === "create") {
            const response = interaction.options.getString("response", true);
            if (guildConfig.customCommands[name]) {
                return interaction.reply({
                    content: `A custom command with that name already exists.`,
                    ephemeral: true,
                });
            }
            guildConfig.customCommands[name] = response;
            await setGuildConfig(guildId, guildConfig);
        } else if (sub === "update") {
            const response = interaction.options.getString("response", true);
            if (!guildConfig.customCommands[name]) {
                return interaction.reply({
                    content: `No custom command with that name exists.`,
                    ephemeral: true,
                });
            }
            guildConfig.customCommands[name] = response;
            await setGuildConfig(guildId, guildConfig);
            // Optionally patch the command in Discord (not strictly needed, as we re-register below)
        } else if (sub === "delete") {
            if (!guildConfig.customCommands[name]) {
                return interaction.reply({
                    content: `No custom command with that name exists.`,
                    ephemeral: true,
                });
            }
            delete guildConfig.customCommands[name];
            await setGuildConfig(guildId, guildConfig);
            // Remove the slash command from Discord
            const guildCommands = await rest.get(
                Routes.applicationGuildCommands(clientId, guildId),
            );
            if (Array.isArray(guildCommands)) {
                const toDelete = guildCommands.find(
                    (cmd: any) => cmd.name === name,
                );
                if (toDelete) {
                    await rest.delete(
                        Routes.applicationGuildCommand(
                            clientId,
                            guildId,
                            toDelete.id,
                        ),
                    );
                }
            }
        }
        // Re-register all custom commands for this guild
        const customCommands = Object.keys(guildConfig.customCommands).map(
            (cmdName) =>
                ({
                    name: cmdName,
                    description: `Custom command: ${cmdName}`,
                    type: 1 as const,
                }) as any,
        );
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: customCommands,
        });
        await interaction.reply({
            content: `Custom command "${name}" ${sub}d!`,
            ephemeral: true,
        });
    },
    async autocomplete(_client: Client, interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused();
        const guildId = interaction.guildId;
        if (!guildId) return interaction.respond([]);
        const guildConfig = await getGuildConfig(guildId);
        const choices = Object.keys(guildConfig.customCommands)
            .filter((cmd) => cmd.startsWith(focused.toLowerCase()))
            .slice(0, 25)
            .map((cmd) => ({ name: cmd, value: cmd }));
        return interaction.respond(choices);
    },
});
