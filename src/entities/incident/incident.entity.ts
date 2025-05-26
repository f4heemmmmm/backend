// backend/src/entities/incident/incident.entity.ts

import { createHash } from "crypto";
import { Entity, Column, PrimaryColumn, Index, BeforeInsert, BeforeUpdate } from "typeorm";

@Entity("incident")
@Index(["user", "windows_start", "windows_end"], { unique: true })
export class Incident {
    @PrimaryColumn()
    ID: string;

    @Column()
    user: string;

    @Column("timestamp")
    windows_start: Date;

    @Column("timestamp")
    windows_end: Date;

    @Column("decimal", { precision: 10, scale: 2 })
    score: number;

    @Column("text", { array: true })
    windows: string[];

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at: Date;

    /**
     * Generates a unique identifier for the incident based on composite key fields
     * This method is automatically called before inserting or updating an incident entity
     * Uses SHA-256 hashing of user, windows_start, and windows_end to create a deterministic ID
     */
    @BeforeInsert()
    @BeforeUpdate()
    generateID() {
        const hashInput = `${this.user}|${this.windows_start.toISOString()}|${this.windows_end.toISOString()}`;
        this.ID = createHash("sha256").update(hashInput).digest("hex");
    }
};