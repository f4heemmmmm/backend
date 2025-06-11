// backend/src/modules/incident/status-history/incident-status-history.entity.ts
import { Incident } from "../incident.entity";
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, EntityMetadata } from "typeorm";

/**
 * IncidentStatusHistory entity for tracking incident status changes over time.
 * 
 * Features comprehensive audit trail functionality including:
 *  - UUID primary key for unique identification
 *  - Foreign key relationship to incident entity
 *  - Status transition tracking (previous/new states)
 *  - Action classification (closed/reopened)
 *  - User tracking for accountability
 *  - Automatic timestamp management for audit trails
 *  - Database indexes for efficient querying
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
    action: string;

    @Column()
    user_id: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @ManyToOne(() => Incident, { onDelete: "CASCADE" })
    @JoinColumn({ name: "incident_id" })
    incident: Incident;
}