import {
    InteractionReplyOptions,
    InteractionUpdateOptions,
    Interaction,
} from "discord.js";
import { logger } from "./logger";

export async function safeReply(
    interaction: any,
    options: InteractionReplyOptions,
) {
    try {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(options);
        } else if (interaction.deferred) {
            await interaction.editReply(options);
        } else {
            await interaction.followUp({ ...options, ephemeral: true });
        }
    } catch (err) {
        logger.error("Failed to reply to interaction", err);
    }
}

export async function safeUpdate(
    interaction: any,
    options: InteractionUpdateOptions,
) {
    try {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.update(options);
        } else if (interaction.deferred) {
            await interaction.editReply(options);
        } else {
            await interaction.followUp({ ...options, ephemeral: true });
        }
    } catch (err) {
        logger.error("Failed to update interaction", err);
    }
}
