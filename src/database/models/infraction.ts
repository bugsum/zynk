export type InfractionType = "warn" | "mute" | "kick" | "ban" | string;

export interface Infraction {
    id: string;
    userId: string;
    guildId: string;
    type: InfractionType;
    reason: string;
    moderatorId: string;
    timestamp: number;
    expiresAt?: number;
    active: boolean;
}
