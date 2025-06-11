// backend/src/database/migrations/1700000000000-CreateIncidentStatusHistory.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIncidentStatusHistory1700000000000 implements MigrationInterface {
    name = 'CreateIncidentStatusHistory1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the incident_status_history table
        await queryRunner.query(`
            CREATE TABLE incident_status_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                incident_id VARCHAR NOT NULL,
                previous_status BOOLEAN NOT NULL,
                new_status BOOLEAN NOT NULL,
                action VARCHAR NOT NULL CHECK (action IN ('closed', 'reopened')),
                user_id VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX idx_incident_status_history_incident_id 
            ON incident_status_history(incident_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_incident_status_history_created_at 
            ON incident_status_history(created_at);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_incident_status_history_incident_created 
            ON incident_status_history(incident_id, created_at);
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE incident_status_history 
            ADD CONSTRAINT fk_incident_status_history_incident 
            FOREIGN KEY (incident_id) REFERENCES incident("ID") ON DELETE CASCADE;
        `);

        // Create initial status history records for existing incidents
        await queryRunner.query(`
            INSERT INTO incident_status_history (incident_id, previous_status, new_status, action, created_at)
            SELECT 
                "ID",
                false as previous_status,
                "isClosed" as new_status,
                CASE 
                    WHEN "isClosed" = true THEN 'closed'
                    ELSE 'reopened'
                END as action,
                created_at
            FROM incident
            WHERE "ID" IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS incident_status_history CASCADE;`);
    }
}