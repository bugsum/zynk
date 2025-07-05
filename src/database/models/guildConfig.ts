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
    customCommands: Record<string, string>;
}

export const defaultConfig: GuildConfig = {
    features: {
        welcome: {
            enabled: false,
            channelId: null,
            message: "Welcome {user} to {guild}!",
        },
        moderation: {
            enabled: true,
            defaultTimeout: 600,
            escalationPolicy: [
                { action: "warn" },
                { action: "mute", duration: 600 },
                { action: "kick" },
                { action: "ban" },
            ],
            autoPurge: {
                enabled: true,
                duration: 30,
            },
            ephemeralResponses: false,
        },
        logging: {
            enabled: false,
            channelId: null,
            logJoins: true,
            logInfractions: true,
            infractionsChannelId: null,
        },
    },
    customCommands: {},
};
