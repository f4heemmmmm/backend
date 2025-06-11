// backend/src/modules/incident/comment/incident-comment.entity.ts

import { Incident } from "../incident.entity";
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";

/**
 * IncidentComment entity for storing user comments on incidents.
 * 
 * Features comprehensive comment functionality including:
 *  - UUID prumary key for unique identification
 *  - Foreign key relationship to incident entity
 *  - User tracking for comment ownership and accountability
 *  - Comment content with rich text support
 *  - Automatic timestamp management for creation and updates
 *  - Database indexes for efficient querying by incident
 *  - Soft deletion capability for comment management
 */

@Entity("incident_comments")
@Index(["incident_id", "created_at"])
@Index(["incident_id"])
@Index(["user_id"])
export class IncidentComment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    incident_id: string;

    @Column()
    user_id: string;

    @Column("text")
    content: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at: Date;

    @Column({ type: "boolean", default: false })
    is_deleted: boolean;

    @ManyToOne(() => Incident, { onDelete: "CASCADE" })
    @JoinColumn({ name: "incident_id" })
    incident: Incident;
}