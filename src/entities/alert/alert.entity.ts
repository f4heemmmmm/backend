import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("alert")
@Index(["user", "datestr", "alert_name"], { unique: true })
export class Alert {
    @PrimaryGeneratedColumn("uuid")
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

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at: Date;
}