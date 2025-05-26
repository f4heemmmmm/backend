// backend/src/config/app.config.ts

import * as path from "path";
import { registerAs } from "@nestjs/config";
import { Alert } from "src/entities/alert/alert.entity";
import { Incident } from "src/entities/incident/incident.entity";

/**
 * Application configuration factory that provides database, storage, and monitoring settings
 * Uses environment variables with sensible defaults for development
 */
const defaultStoragePath = path.join(__dirname, "../../storage");

export default registerAs("config", () => ({
    database: {
        type: "postgres",
        host: process.env.DATABASE_HOST || "localhost",
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        database: process.env.DATABASE_NAME || "insider_threat",
        username: process.env.DATABASE_USERNAME || "postgres",
        password: process.env.DATABASE_PASSWORD || "postgres",
        entities: [Alert, Incident],
        migrations: [__dirname + "/../migrations/*.ts"],
        migrationsTableName: "migrations",
        synchronize: process.env.NODE_ENV !== "production",
        logging: process.env.NODE_ENV !== "production",
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    },
    storage: {
        csv: {
            dropPath: process.env.CSV_DROP_PATH || path.join(defaultStoragePath, "csv/drop"),
            processedPath: process.env.CSV_PROCESSED_PATH || path.join(defaultStoragePath, "csv/processed"),
            errorPath: process.env.CSV_ERROR_PATH || path.join(defaultStoragePath, "csv/error")
        }
    },
    monitoring: {
        interval: parseInt(process.env.CSV_MONITOR_INTERVAL || "5000")
    },
    server: {
        port: parseInt(process.env.PORT || "3000"),
        environment: process.env.NODE_ENV || "development"
    }
}));