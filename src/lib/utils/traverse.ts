import { readdirSync } from "node:fs";
import { join } from "node:path";
import { logger } from "./logger";

export async function traverse(directory: string): Promise<Object[]> {
    const entries = readdirSync(directory, { withFileTypes: true });
    const result: Object[] = [];

    for (const entry of entries) {
        const finalPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            const subEntries = await traverse(finalPath);

            result.push(...subEntries);
        } else if (entry.isFile()) {
            try {
                result.push(require(finalPath).default);
            } catch (error) {
                logger.error(`Failed to load event: ${finalPath}`);
                logger.error(error);
            }
        }
    }

    return result;
}
