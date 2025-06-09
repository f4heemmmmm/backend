// backend/src/modules/alert/alert.entity.ts
import { createHash } from "crypto";
import { Entity, Column, PrimaryColumn, Index, BeforeInsert, BeforeUpdate } from "typeorm";

/**
 * Alert entity for security alert data storage with MITRE ATT&CK integration.
 * 
 * Features composite unique constraint and automatic ID generation using:
 * - SHA-256 hashing for deterministic IDs based on user, date, and alert name
 * - JSONB evidence storage for flexible security event data
 * - MITRE framework fields for threat intelligence classification
 * - Incident correlation tracking with relationship fields
 * - Automatic timestamp management for audit trails
 */
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
     * Generates deterministic SHA-256 hash ID from composite key fields.
     * Called automatically before insert/update operations.
     */
    @BeforeInsert()
    @BeforeUpdate()
    generateId() {
        const hashInput = `${this.user}|${this.datestr.toISOString()}|${this.alert_name}`;
        this.ID = createHash("sha256").update(hashInput).digest("hex");
    }
}