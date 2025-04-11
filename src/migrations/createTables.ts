import { Migration, MigrationInterface, QueryRunner } from "typeorm";

export class createTables implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS incident (
                id UUID pRIMARY KEY DEFAULT uuid_generate_v4(),
                user VARCHAR NOT NULL, 
                windows_start TIMESTAMP NOT NULL, 
                windows_end TIMESTAMP NOT NULL,
                score FLOAT NOT NULL, 
                windows TEXT[] NOT NULL DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS alert (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user VARCHAR NOT NULL,
                datestr TIMESTAMP NOT NULL,
                evidence JSONB NOT NULL CHECK (jsonb_typeof(evidence) = 'object' AND
                    evidence ? 'site' AND
                    evidence ? 'count' AND
                    evidence ? 'list_raw_events' AND
                    jsonb_typeof(evidence -> 'list_raw_events') = 'array'
                ),
                score FLOAT NOT NULL,
                alert_name VARCHAR NOT NULL, 
                MITRE_tactic VARCHAR NOT NULL,
                MITRE_technique VARCHAR NOT NULL, 
                Logs TEXT NOT NULL,
                Description TEXT NOT NULL,
                Detection_model VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS alert;
            DROP TABLE IF EXISTS incident;
            DROP EXTENSION IF EXISTS "uuid-ossp";
        `);
    }
}