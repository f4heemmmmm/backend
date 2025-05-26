"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const alert_entity_1 = require("../entities/alert/alert.entity");
const incident_entity_1 = require("../entities/incident/incident.entity");
exports.AppDataSource = new typeorm_1.DataSource({
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
    ssl: false,
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map