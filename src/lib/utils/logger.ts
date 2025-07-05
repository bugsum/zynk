import { createLogger, format, transports } from "winston";
import { fetchConfig } from "./configReader";
import path from "node:path";

const { combine, timestamp, printf, colorize, errors, json } = format;

// Custom log format
const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const config = fetchConfig(path.join(process.cwd(), "config.yml"));

// Create the logger
export const logger = createLogger({
    level: config?.debug ? "debug" : "info", // Default level
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Add timestamp
        errors({ stack: true }), // Print stack traces for errors
        json(), // Enable JSON format for structured logs
        customFormat, // Custom format
    ),
    transports: [
        // Write logs to a file
        new transports.File({ filename: "logs/error.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" }),
        new transports.File({ filename: "logs/debug.log", level: "debug" }),
    ],
});

logger.add(
    new transports.Console({
        format: combine(colorize(), customFormat),
    }),
);
