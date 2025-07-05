import { createCommand } from "../handlers/commandHandler";
import { CommandType } from "../lib/types";
import { MessageFlags, SlashCommandBuilder } from "discord.js";

export default createCommand({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("A ping pong command."),
    interact: (client, interaction) => {
        return interaction.reply({
            content: `<:ochakoassist:1350721665130037259> My current latency is ${client.ws.ping}ms`,
            flags: [MessageFlags.Ephemeral],
        });
    },
});
