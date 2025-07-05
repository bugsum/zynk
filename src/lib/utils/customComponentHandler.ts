import {
    Client,
    Interaction,
    MessageComponentInteraction,
    ModalSubmitInteraction,
} from "discord.js";
import { safeReply, safeUpdate, logger } from "./index";

// Map of prefix -> handler
const componentHandlers: Record<
    string,
    (interaction: Interaction) => Promise<void>
> = {};

export function registerComponentHandler(
    prefix: string,
    handler: (interaction: Interaction) => Promise<void>,
) {
    componentHandlers[prefix] = handler;
}

export function setupComponentHandler(client: Client) {
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isMessageComponent() && !interaction.isModalSubmit())
            return;
        const customId = (
            interaction as MessageComponentInteraction | ModalSubmitInteraction
        ).customId;
        for (const prefix of Object.keys(componentHandlers)) {
            if (customId.startsWith(prefix)) {
                try {
                    await componentHandlers[prefix](interaction);
                } catch (err) {
                    logger.error(
                        `[ComponentHandler] Error in handler for ${prefix}`,
                        err,
                    );
                    await safeReply(interaction, {
                        content: "An error occurred handling this component.",
                        ephemeral: true,
                    });
                }
                return;
            }
        }
    });
}
