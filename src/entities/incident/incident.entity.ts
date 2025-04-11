import { Entity, Column, PrimaryGeneratedColumn, Index  } from "typeorm";

@Entity("incident")
@Index(["user", "windows_start", "windows_end"], { unique: true })
export class Incident {
    @PrimaryGeneratedColumn("uuid")
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
}