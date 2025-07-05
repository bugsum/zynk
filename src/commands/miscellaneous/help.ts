import { createCommand } from "../../handlers/commandHandler";
import { CommandType } from "../../lib/types";
import { logger } from "../../lib/utils";
import { fetchCommands } from "../../lib/utils/fetch";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import path from "node:path";

export default createCommand({
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("A help command to assist the confused humans."),

    interact: async (client, interaction) => {
        try {
            const commands = await fetchCommands(path.join(__dirname, "../"));

            // Process commands to extract necessary details
            const commandDetails = commands.map((command) => {
                return `**${command.data.name}**: ${command.data.description || "No description available."}`;
            });

            // Format the response
            const response = commandDetails.join("\n");

            // Send the response to the channel
            return interaction.reply({
                content: `Here are all the available commands:\n\n${response}`,
            });
        } catch (error) {
            logger.error("Failed to fetch commands for help command", error);
            return interaction.reply({
                content: "Could not fetch commands. Please try again later.",
            });
        }
    },
});
