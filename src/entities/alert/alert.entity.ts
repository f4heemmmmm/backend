// backend/src/entities/alert/alert.entity.ts

import { createHash } from "crypto";
import { Entity, Column, PrimaryColumn, Index, BeforeInsert, BeforeUpdate } from "typeorm";

@Entity("alert")
@Index(["user", "datestr", "alert_name"], { unique: true })
export class Alert {
    @PrimaryColumn()
    ID: string;

    @Column()
    user: string;

    @Column("timestamp")
    datestr: Date;

    @Column("jsonb")
    evidence: Record<string, any>;

    @Column("decimal", { precision: 10, scale: 2 })
    score: number;

    @Column()
    alert_name: string;

    @Column()
    MITRE_tactic: string;

    @Column()
    MITRE_technique: string;

    @Column("text", { nullable: true })
    Logs: string;

    @Column()
    Detection_model: string;

    @Column("text", { nullable: true })
    Description: string;

    @Column({ type: "boolean", default: false })
    isUnderIncident: boolean;
    
    @Column({ type: "varchar", nullable: true })
    incidentID: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at: Date;

    /**
     * Generates a unique identifier for the alert based on composite key fields
     * This method is automatically called before inserting or updating an alert entity
     * Uses SHA-256 hashing of user, datestr, and alert_name to create a deterministic ID
     */
    @BeforeInsert()
    @BeforeUpdate()
    generateId() {
        const hashInput = `${this.user}|${this.datestr.toISOString()}|${this.alert_name}`;
        this.ID = createHash("sha256").update(hashInput).digest("hex");
    }
}