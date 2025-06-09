// backend/src/config/app.config.ts
import * as path from "path";
import { registerAs } from "@nestjs/config";

import { User } from "src/modules/user/user.entity";
import { Alert } from "src/modules/alert/alert.entity";
import { Incident } from "src/modules/incident/incident.entity";

const defaultStoragePath = "/app/storage";

/**
 * Application configuration factory for NestJS ConfigModule.
 * 
 * Provides centralized configuration management with:
 * - Environment-aware database settings with TypeORM integration
 * - File storage paths for CSV processing workflows
 * - Monitoring intervals and server configuration
 * - Production vs development migration path handling
 * 
 * Uses environment variables with sensible defaults for deployment flexibility.
 */
export default registerAs("config", () => ({
    database: {
        type: "postgres",
        host: process.env.DATABASE_HOST || "localhost",
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        database: process.env.DATABASE_NAME || "insider_threat",
        username: process.env.DATABASE_USERNAME || "postgres",
        password: process.env.DATABASE_PASSWORD || "postgres",
        entities: [Alert, Incident, User],
        migrations: process.env.NODE_ENV === "production" 
            ? [__dirname + "/../migrations/*.js"]
            : [__dirname + "/../migrations/*.ts"],
        migrationsTableName: "migrations",
        synchronize: process.env.NODE_ENV !== "production",
        logging: process.env.NODE_ENV !== "production",
        ssl: false
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