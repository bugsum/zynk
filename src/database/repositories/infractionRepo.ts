import { JsonDB } from "../adapters/jsondb";
import { Infraction, InfractionType } from "../models/infraction";

const db = new JsonDB<Record<string, Infraction[]>>("infractions.json");

export async function addInfraction(
    guildId: string,
    userId: string,
    infraction: Omit<Infraction, "id">,
): Promise<Infraction> {
    const all = await db.get();
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newInfraction: Infraction = { ...infraction, id, userId, guildId };
    const list = all[guildId] || [];
    await db.set({ ...all, [guildId]: [...list, newInfraction] });
    return newInfraction;
}

export async function getInfractions(
    guildId: string,
    userId?: string,
): Promise<Infraction[]> {
    const all = await db.get();
    const list = all[guildId] || [];
    return userId ? list.filter((i) => i.userId === userId) : list;
}

export async function updateInfraction(
    guildId: string,
    infractionId: string,
    updater: (i: Infraction) => Infraction,
): Promise<boolean> {
    const all = await db.get();
    const list = all[guildId] || [];
    const idx = list.findIndex((i) => i.id === infractionId);
    if (idx === -1) return false;
    list[idx] = updater(list[idx]);
    await db.set({ ...all, [guildId]: list });
    return true;
}

export async function removeInfraction(
    guildId: string,
    infractionId: string,
): Promise<boolean> {
    const all = await db.get();
    const list = all[guildId] || [];
    const newList = list.filter((i) => i.id !== infractionId);
    if (newList.length === list.length) return false;
    await db.set({ ...all, [guildId]: newList });
    return true;
}

// Escalation policy: array of steps, each with action and optional duration (ms)
export const escalationPolicy: { action: string; duration?: number }[] = [
    { action: "warn" },
    { action: "mute", duration: 10 * 60 * 1000 }, // 10 minutes
    { action: "mute", duration: 60 * 60 * 1000 }, // 1 hour
    { action: "kick" },
    { action: "ban" },
];

export async function getNextEscalation(
    guildId: string,
    userId: string,
): Promise<{ action: string; duration?: number }> {
    const infractions = await getInfractions(guildId, userId);
    // Count only active or recent (last 30 days) infractions
    const now = Date.now();
    const recent = infractions.filter(
        (i) => i.timestamp > now - 30 * 24 * 60 * 60 * 1000,
    );
    const step = Math.min(recent.length, escalationPolicy.length - 1);
    return escalationPolicy[step];
}
