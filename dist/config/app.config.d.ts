import { Alert } from "src/entities/alert/alert.entity";
import { Incident } from "src/entities/incident/incident.entity";
declare const _default: (() => {
    database: {
        type: string;
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        entities: (typeof Alert | typeof Incident)[];
        migrations: string[];
        migrationsTableName: string;
        synchronize: boolean;
        logging: boolean;
        ssl: boolean | {
            rejectUnauthorized: boolean;
        };
    };
    storage: {
        csv: {
            dropPath: string;
            processedPath: string;
            errorPath: string;
        };
    };
    monitoring: {
        interval: number;
    };
    server: {
        port: number;
        environment: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    database: {
        type: string;
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        entities: (typeof Alert | typeof Incident)[];
        migrations: string[];
        migrationsTableName: string;
        synchronize: boolean;
        logging: boolean;
        ssl: boolean | {
            rejectUnauthorized: boolean;
        };
    };
    storage: {
        csv: {
            dropPath: string;
            processedPath: string;
            errorPath: string;
        };
    };
    monitoring: {
        interval: number;
    };
    server: {
        port: number;
        environment: string;
    };
}>;
export default _default;
