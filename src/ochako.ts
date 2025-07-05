import { Command, Event, Options } from "./lib/types";
import { logger, traverse } from "./lib/utils";
import { Collection, Client as DiscordClient } from "discord.js";
import { eventExecutor } from "./handlers/eventHandler";

export class Client<
    Ready extends boolean = boolean,
> extends DiscordClient<Ready> {
    eventsPath: string;
    commandsPath: string;
    commandMap: Collection<string, Command>;

    constructor(options: Options) {
        super(options);

        this.eventsPath = options.eventsPath;
        this.commandsPath = options.commandsPath;
        this.commandMap = new Collection();
    }

    public async registerEvents(): Promise<void> {
        const events = (await traverse(this.eventsPath)) as Event[];

        if (!events.length) {
            logger.warn("No events found in the events directory");
            return;
        }

        for (const event of events as Event[]) {
            eventExecutor(this, event);
        }
    }

    public async registerCommands(): Promise<void> {
        const commands = (await traverse(this.commandsPath)) as Command[];

        if (!commands.length) {
            logger.warn("No Commands found in the commands directory");
            return;
        }

        for (const command of commands) {
            this.commandMap.set(command.data.name, command);
        }
    }
}
