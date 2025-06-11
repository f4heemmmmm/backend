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
    id: string;

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
    is_under_incident: boolean;
    
    @Column({ type: "varchar", nullable: true })
    incident_id: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at: Date;

    @BeforeInsert()
    @BeforeUpdate()
    generateId() {
        const hashInput = `${this.user}|${this.datestr.toISOString()}|${this.alert_name}`;
        this.id = createHash("sha256").update(hashInput).digest("hex");
    }
}