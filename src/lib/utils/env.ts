import { config } from "dotenv";
import { join, resolve } from "node:path";

const environment = process.env.NODE_ENV || "development";
const configPath =
    environment === "production" ? ".env" : `.env.${environment}`;

config({
    path: resolve(join(process.cwd(), configPath)),
});

export function env(key: string, fallBack?: string): string {
    const value = process.env[key] ?? fallBack;

    if (!value) {
        throw new Error(
            `No Environment Variable or Fallback value found for: ${key}`,
        );
    }

    return value;
}
