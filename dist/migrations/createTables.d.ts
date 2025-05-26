import { MigrationInterface, QueryRunner } from "typeorm";
export declare class createTables implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
