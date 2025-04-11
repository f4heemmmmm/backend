import * as path from "path";
import { registerAs } from "@nestjs/config";

// Entity Import
import { Alert } from "src/entities/alert/alert.entity";
import { Incident } from "src/entities/incident/incident.entity";

const storagePath = path.join(__dirname, "../../storage");

export default registerAs("config", () => ({
    database: {
        type: "postgres",
        host: process.env.DATABASE_HOST || "localhost",
        port: parseInt(process.env.DATABASE_PORT || "5432"),
        database: process.env.DATABASE_NAME || "insider_threat",
        username: process.env.DATABASE_USERNAME || "postgres",
        password: process.env.DATABASE_PASSWORD || "postgres",
        entities: [Alert, Incident],
        migrations: [__dirname + '/../migrations/*.ts'],
        migrationsTableName: "migrations",
        synchronize: process.env.NODE_ENV !== "production",
        logging: process.env.NODE_ENV !== "production",
        ssl: false
    },
    storage: {
        csv: {
            dropPath: path.join(storagePath, "csv/drop"),
            processedPath: path.join(storagePath, "csv/processed"),
            errorPath: path.join(storagePath, "csv/error")
        }
    },
    monitoring: {
        interval: 5000
    }
}));