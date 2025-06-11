// backend/src/modules/incident/incident.module.ts
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module, forwardRef } from "@nestjs/common";

import { Incident } from "./incident.entity";
import { IncidentStatusHistory } from "./incident-status-history.entity";
import { IncidentComment } from "./incident-comment.entity"; // Add this import
import { UserModule } from "../user/user.module";
import { AlertModule } from "../alert/alert.module";
import { IncidentService } from "./incident.service";
import { IncidentController } from "./incident.controller";

/**
 * IncidentModule for security incident management with alert correlation, status tracking, and comments.
 * 
 * Enhanced with status history and comment functionality:
 * - TypeORM entity registration for Incident, IncidentStatusHistory, and IncidentComment data access
 * - Circular dependency resolution with AlertModule using forwardRef
 * - JWT authentication integration through UserModule
 * - Incident service for business logic and data operations
 * - Service export for cross-module incident functionality
 * - Comprehensive status change tracking and audit trails
 * - Full comment system with user ownership and permissions
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Incident, IncidentStatusHistory, IncidentComment]), // Add IncidentComment here
        forwardRef(() => AlertModule),
        UserModule,
    ],
    controllers: [IncidentController],
    providers: [IncidentService],
    exports: [IncidentService],
})
export class IncidentModule {}