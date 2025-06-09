// backend/src/database/migrations/1640000000000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CreateUsersTable migration for user authentication and management.
 * 
 * Creates the users table with:
 * - UUID primary key with automatic generation
 * - Email-based authentication with unique constraint
 * - User profile fields (firstName, lastName)
 * - Active status tracking and timestamps
 * - Performance indexes on email and active status
 * - Default admin user for initial system access
 */
export class CreateUsersTable1640000000000 implements MigrationInterface {
    name = "CreateUsersTable1640000000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "firstName" character varying(100),
                "lastName" character varying(100),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_users_email" ON "users" ("email");
            CREATE INDEX "IDX_users_active" ON "users" ("isActive");
        `);

        await queryRunner.query(`
            INSERT INTO "users" ("email", "password", "firstName", "lastName", "isActive") 
            VALUES ('admin@ensigninfosecurity.com', 'password123', 'Admin', 'User', true);
        `);

        console.log("✅ Users table created with default user");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_users_active"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}