// incident.entity.ts (updated)
import { Entity, Column, PrimaryColumn, Index, BeforeInsert, BeforeUpdate } from "typeorm";
import { createHash } from "crypto";

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

    @BeforeInsert()
    @BeforeUpdate()
    generateId() {
        // Create a hash using the composite key fields
        const hashInput = `${this.user}|${this.windows_start.toISOString()}|${this.windows_end.toISOString()}`;
        this.ID = createHash('sha256').update(hashInput).digest('hex');
    }
}