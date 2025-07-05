import type { Client } from "../../ochako";
import {
    Awaitable,
    ChatInputCommandInteraction,
    ClientEvents,
    ClientOptions,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
    Snowflake,
    AutocompleteInteraction,
} from "discord.js";
import { CommandOptionType, CommandType } from "./enums";

/**
 * Defines the options and types for configuring and handling events in a Discore client.
 *
 * @interface Options
 * @extends ClientOptions
 *
 * @property {string} eventsPath - The path to the directory containing event handlers.
 * @property {string} [commandsPath] - The optional path to the directory containing command handlers.
 * @property {Snowflake[]} [developers] - An optional array of developer IDs with elevated permissions.
 */

export interface Options extends ClientOptions {
    eventsPath: string;
    commandsPath: string;
    developers?: Snowflake[];
}

/**
 * @typedef {keyof ClientEvents} EventNames - Represents the names of possible client events.
 */
export type EventNames = keyof ClientEvents;

/**
 * @typedef {function} EventListener - A function type for handling specific client events.
 * @param {Client} instance - The client instance triggering the event.
 * @param {...any} args - The arguments associated with the event.
 * @returns {Awaitable<unknown>} - A promise that resolves when the event handling is complete.
 */
export type EventListener<EventName extends EventNames> = (
    instance: Client,
    ...args: ClientEvents[EventName]
) => Awaitable<unknown>;

/**
 * @interface Event
 * @template EventName
 * @property {EventName} name - The name of the event.
 * @property {boolean} runOnce - Indicates if the event should be executed only once.
 * @property {EventListener<EventName>} listener - The function to execute when the event is triggered.
 */
export interface Event<EventName extends EventNames = EventNames> {
    name: EventName;
    runOnce?: boolean;
    listener: EventListener<EventName>;
}

/* -------------------------------------------------------------------------- */
/*            These are the interfaces for all chat input commands            */
/* -------------------------------------------------------------------------- */

export interface Command {
    data:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    interact: CommandListener;
    autocomplete?: (
        client: Client,
        interaction: AutocompleteInteraction,
    ) => Awaitable<unknown>;
}

export interface CommandOptions {
    name: string;
    description: string;
    required?: boolean;
    type?: CommandOptionType;
    options?: CommandOptions;
}

export type CommandListener = (
    instance: Client,
    interaction: ChatInputCommandInteraction,
) => Awaitable<unknown>;

/* -------------------------------------------------------------------------- */
/*     A interface to determine the values of the public config yaml file     */
/* -------------------------------------------------------------------------- */

export interface Config {
    debug: boolean;
}

export interface Invite {
    code: string;
    inviterId: string;
    uses: number;
    createdAt: number;
    guildId: string;
}

export interface AltFlag {
    userId: string;
    guildId: string;
    reason: string;
    flaggedAt: number;
}

export interface GiveawayRequirement {
    minInvites?: number;
    noAlts?: boolean;
}

export interface GiveawayEntry {
    userId: string;
    joinedAt: number;
}

export interface Giveaway {
    id: string;
    guildId: string;
    channelId: string;
    messageId: string;
    prize: string;
    endTime: number;
    requirements: GiveawayRequirement;
    entries: GiveawayEntry[];
    winnerIds: string[];
    ended: boolean;
}
