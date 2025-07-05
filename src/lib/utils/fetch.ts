import { Command } from "../types";
import { traverse } from "./traverse";

export async function fetchCommands(path: string) {
    const commands = (await traverse(path)) as Command[];

    return commands;
}
