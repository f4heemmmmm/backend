"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const config_1 = require("@nestjs/config");
const alert_entity_1 = require("../entities/alert/alert.entity");
const incident_entity_1 = require("../entities/incident/incident.entity");
const defaultStoragePath = path.join(__dirname, "../../storage");
exports.default = (0, config_1.registerAs)("config", () => ({
    database: {
        type: "postgres",
        host: process.env.DATABASE_HOST || "localhost",
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        database: process.env.DATABASE_NAME || "insider_threat",
        username: process.env.DATABASE_USERNAME || "postgres",
        password: process.env.DATABASE_PASSWORD || "postgres",
        entities: [alert_entity_1.Alert, incident_entity_1.Incident],
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
//# sourceMappingURL=app.config.js.map