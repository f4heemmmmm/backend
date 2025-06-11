// backend/src/modules/incident/incident-status-history.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Incident } from "./incident.entity";

/**
 * IncidentStatusHistory entity for tracking incident status changes over time.
 * 
 * Features comprehensive audit trail functionality including:
 * - UUID primary key for unique identification
 * - Foreign key relationship to incident entity
 * - Status transition tracking (previous/new states)
 * - Action classification (closed/reopened)
 * - User tracking for accountability (optional)
 * - Automatic timestamp management for audit trails
 * - Database indexes for efficient querying
 */
@Entity("incident_status_history")
@Index(["incident_id", "created_at"])
@Index(["incident_id"])
export class IncidentStatusHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    incident_id: string;

    @Column()
    previous_status: boolean;

    @Column()
    new_status: boolean;

    @Column()
    action: string; // "closed" | "reopened"

    @Column({ nullable: true })
    user_id: string; // Who made the change (optional for now)

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @ManyToOne(() => Incident, { onDelete: "CASCADE" })
    @JoinColumn({ name: "incident_id" })
    incident: Incident;
}