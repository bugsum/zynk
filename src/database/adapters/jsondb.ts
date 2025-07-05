import { promises as fs } from "fs";
import path from "node:path";
import { Invite, AltFlag, Giveaway } from "../../lib/types/interfaces";

export class JsonDB<T extends object = Record<string, any>> {
    private filePath: string;
    private data: T | null = null;

    constructor(filename: string) {
        this.filePath = path.resolve(process.cwd(), "data", filename);
    }

    private async ensureFile() {
        try {
            await fs.access(this.filePath);
        } catch {
            await fs.mkdir(path.dirname(this.filePath), { recursive: true });
            await fs.writeFile(this.filePath, JSON.stringify({}, null, 2));
        }
    }

    private async load(): Promise<T> {
        await this.ensureFile();
        if (!this.data) {
            const content = await fs.readFile(this.filePath, "utf-8");
            this.data = JSON.parse(content) as T;
        }
        return this.data;
    }

    public async get(): Promise<T> {
        return await this.load();
    }

    public async set(data: T): Promise<void> {
        this.data = data;
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    }

    public async update(updater: (data: T) => T): Promise<void> {
        const current = await this.load();
        const updated = updater(current);
        await this.set(updated);
    }

    public async delete(): Promise<void> {
        this.data = null;
        await fs.unlink(this.filePath);
    }
}

export const InvitesDB = new JsonDB<Record<string, Invite[]>>("invites.json");
export const AltsDB = new JsonDB<Record<string, AltFlag[]>>("alts.json");
export const GiveawaysDB = new JsonDB<Record<string, Giveaway[]>>(
    "giveaways.json",
);
