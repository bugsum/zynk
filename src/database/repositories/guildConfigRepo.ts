import { JsonDB } from "../adapters/jsondb";
import { GuildConfig, defaultConfig } from "../models/guildConfig";

const db = new JsonDB<Record<string, GuildConfig>>("guildConfig.json");

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
    const all = await db.get();
    return {
        ...defaultConfig,
        ...all[guildId],
        features: {
            ...defaultConfig.features,
            ...(all[guildId]?.features || {}),
        },
        customCommands: {
            ...defaultConfig.customCommands,
            ...(all[guildId]?.customCommands || {}),
        },
    };
}

export async function setGuildConfig(guildId: string, config: GuildConfig) {
    const all = await db.get();
    await db.set({ ...all, [guildId]: config });
}

export async function updateGuildConfig(
    guildId: string,
    updater: (cfg: GuildConfig) => GuildConfig,
) {
    const current = await getGuildConfig(guildId);
    await setGuildConfig(guildId, updater(current));
}

export async function initGuildConfig(guildId: string) {
    const all = await db.get();
    if (!all[guildId]) {
        await setGuildConfig(guildId, defaultConfig);
    }
}
