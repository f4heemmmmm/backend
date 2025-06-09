// backend/src/modules/user/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * User entity for system authentication and user management.
 * 
 * Features secure user data storage with:
 * - UUID primary key generation for unique user identification
 * - Email-based authentication with unique constraint enforcement
 * - Password storage for credential verification
 * - Optional user profile fields (firstName, lastName)
 * - Active status tracking for account management
 * - Automatic timestamp tracking for audit trails
 */
@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ length: 255 })
    password: string;

    @Column({ length: 100, nullable: true })
    firstName?: string;

    @Column({ length: 100, nullable: true })
    lastName?: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}