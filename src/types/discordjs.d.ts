import "discord.js";
import type { GuildConfig } from "../database/guildConfig";
import type { JsonDB } from "../database/jsondb";
import type { Logger } from "winston";

// Augment the discord.js Client type with your custom properties
declare module "discord.js" {
    interface Client {
        // Example: global config for the bot
        config?: any;
        // Example: guild config database
        guildConfig?: JsonDB<Record<string, GuildConfig>>;
        // Example: logger instance
        logger?: Logger;
        // Add more custom properties as needed
        // db?: YourDbType;
        // cache?: YourCacheType;
    }
}
