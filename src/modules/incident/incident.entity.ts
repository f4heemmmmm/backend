// backend/src/modules/incident/incident.entity.ts
import { createHash } from "crypto";
import { Entity, Column, PrimaryColumn, Index, BeforeInsert, BeforeUpdate } from "typeorm";

/**
 * Incident entity for security incident data storage with time window tracking.
 * 
 * Features composite unique constraint and automatic ID generation using:
 * - SHA-256 hashing for deterministic IDs based on user and time window boundaries
 * - Text array storage for flexible incident window data
 * - Timestamp tracking for incident start/end periods and audit trails
 * - Decimal precision scoring for risk assessment values
 * - Boolean status tracking for incident closure state
 * - Automatic timestamp management for created/updated tracking
 */
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

    @Column({ type: "boolean", default: false })
    isClosed: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at: Date;

    /**
     * Generates deterministic SHA-256 hash ID from composite key fields.
     * Called automatically before insert/update operations.
     */
    @BeforeInsert()
    @BeforeUpdate()
    generateID() {
        const hashInput = `${this.user}|${this.windows_start.toISOString()}|${this.windows_end.toISOString()}`;
        this.ID = createHash("sha256").update(hashInput).digest("hex");
    }
}