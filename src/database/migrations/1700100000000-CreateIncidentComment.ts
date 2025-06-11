// backend/src/database/migrations/1700100000000-CreateIncidentComments.ts

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIncidentComments1700100000000 implements MigrationInterface {
    name = 'CreateIncidentComments1700100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the incident_comments table
        await queryRunner.query(`
            CREATE TABLE incident_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                incident_id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT false
            );
        `);

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX idx_incident_comments_incident_id 
            ON incident_comments(incident_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_incident_comments_user_id 
            ON incident_comments(user_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_incident_comments_created_at 
            ON incident_comments(created_at);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_incident_comments_incident_created 
            ON incident_comments(incident_id, created_at);
        `);

        // Add foreign key constraint to incident
        await queryRunner.query(`
            ALTER TABLE incident_comments 
            ADD CONSTRAINT fk_incident_comments_incident 
            FOREIGN KEY (incident_id) REFERENCES incident("ID") ON DELETE CASCADE;
        `);

        // Add foreign key constraint to users (optional - depends on user table structure)
        await queryRunner.query(`
            ALTER TABLE incident_comments 
            ADD CONSTRAINT fk_incident_comments_user 
            FOREIGN KEY (user_id) REFERENCES users("id") ON DELETE CASCADE;
        `);

        console.log("✅ Incident comments table created successfully");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS incident_comments CASCADE;`);
    }
}