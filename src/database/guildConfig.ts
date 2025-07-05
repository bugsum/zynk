import { JsonDB } from "./adapters/jsondb";
import { defaultConfig } from "./models/guildConfig";

export interface WelcomeConfig {
    enabled: boolean;
    channelId: string | null;
    message: string;
}

export interface AutoPurgeConfig {
    enabled: boolean;
    duration: number; // seconds
}

export interface ModerationConfig {
    enabled: boolean;
    defaultTimeout: number; // seconds
    escalationPolicy: { action: string; duration?: number }[];
    autoPurge: AutoPurgeConfig;
    ephemeralResponses: boolean;
}

export interface LoggingConfig {
    enabled: boolean;
    channelId: string | null;
    logJoins: boolean;
    logInfractions: boolean;
    infractionsChannelId: string | null;
}

export interface FeaturesConfig {
    welcome: WelcomeConfig;
    moderation: ModerationConfig;
    logging: LoggingConfig;
    // Add more features here
}

export interface GuildConfig {
    features: FeaturesConfig;
}

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
