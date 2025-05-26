import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration class responsible for creating the incident and alert tables
 * with their respective constraints and relationships
 */
export class createTables implements MigrationInterface {
    /**
     * Creates the incident and alert tables with proper constraints,
     * foreign key relationships, and unique composite keys
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS incident (
                "ID" VARCHAR(64) PRIMARY KEY,
                user VARCHAR NOT NULL, 
                windows_start TIMESTAMP NOT NULL, 
                windows_end TIMESTAMP NOT NULL,
                score DECIMAL(10,2) NOT NULL, 
                windows TEXT[] NOT NULL DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_incident_composite" UNIQUE (user, windows_start, windows_end)
            );

            CREATE TABLE IF NOT EXISTS alert (
                "ID" VARCHAR(64) PRIMARY KEY,
                user VARCHAR NOT NULL,
                datestr TIMESTAMP NOT NULL,
                evidence JSONB NOT NULL,
                score DECIMAL(10,2) NOT NULL,
                alert_name VARCHAR NOT NULL, 
                "MITRE_tactic" VARCHAR NOT NULL,
                "MITRE_technique" VARCHAR NOT NULL, 
                "Logs" TEXT,
                "Description" TEXT,
                "Detection_model" VARCHAR NOT NULL,
                "isUnderIncident" BOOLEAN DEFAULT FALSE,
                "incidentID" VARCHAR(64) NULL REFERENCES incident('ID'),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_alert_composite" UNIQUE (user, datestr, alert_name)
            );
        `);
    }

    /**
     * Drops the incident and alert tables in reverse order
     * to maintain referential integrity
     */
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS alert;
            DROP TABLE IF EXISTS incident;
        `);
    }
}