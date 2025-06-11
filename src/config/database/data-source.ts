// backend/src/config/database/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "src/modules/user/user.entity";
import { Alert } from "src/modules/alert/alert.entity";
import { Incident } from "src/modules/incident/incident.entity";
import { IncidentComment } from "src/modules/incident/comment/incident-comment.entity";
import { IncidentStatusHistory } from "src/modules/incident/status-history/incident-status-history.entity";

/**
 * TypeORM DataSource configuration for PostgreSQL with environment-aware settings,
 * migration management, and development/production optimization.
 */
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    database: process.env.DATABASE_NAME || "insider_threat",
    username: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    entities: [Alert, Incident, User, IncidentStatusHistory, IncidentComment],
    migrations: [__dirname + "/../../database/migrations/*.ts"],
    migrationsTableName: "migrations",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV !== "production",
    ssl: false,
    subscribers: [],
});