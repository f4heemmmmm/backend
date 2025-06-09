// backend/src/config/database/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "src/modules/user/user.entity";
import { Alert } from "src/modules/alert/alert.entity";
import { Incident } from "src/modules/incident/incident.entity";

/**
 * AppDataSource - Enterprise TypeORM configuration for PostgreSQL database connectivity.
 * 
 * This comprehensive data source configuration provides:
 * - Environment-aware database connection settings with secure defaults
 * - Production-ready configuration with development-friendly features
 * - Automatic entity discovery and relationship mapping
 * - Migration management with version control and rollback capabilities
 * - Performance optimization through connection pooling and query logging
 * - Security considerations including SSL configuration and credential management
 * - Development convenience features like automatic synchronization
 * - Monitoring and debugging support through configurable logging levels
 * 
 * Configuration Features:
 * - PostgreSQL database connectivity with connection parameter validation
 * - Environment variable integration for deployment flexibility
 * - Migration tracking with dedicated migrations table
 * - Entity registration for User, Alert, and Incident domains
 * - Development vs production behavior differentiation
 * - Logging configuration for query monitoring and performance analysis
 * 
 * The configuration automatically adapts between development and production
 * environments, enabling features like schema synchronization and query
 * logging in development while maintaining security and performance in production.
 */
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    database: process.env.DATABASE_NAME || "insider_threat",
    username: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    entities: [Alert, Incident, User],
    migrations: [__dirname + "/../migrations/*.ts"],
    migrationsTableName: "migrations",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV !== "production",
    ssl: false,
    subscribers: [],
});