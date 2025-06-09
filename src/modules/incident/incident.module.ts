// backend/src/modules/incident/incident.module.ts
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module, forwardRef } from "@nestjs/common";

import { Incident } from "./incident.entity";
import { UserModule } from "../user/user.module";
import { AlertModule } from "../alert/alert.module";
import { IncidentService } from "./incident.service";
import { IncidentController } from "./incident.controller";

/**
 * IncidentModule for security incident management with alert correlation.
 * 
 * Provides comprehensive incident functionality including:
 * - TypeORM entity registration for Incident data access
 * - Circular dependency resolution with AlertModule using forwardRef
 * - JWT authentication integration through UserModule
 * - Incident service for business logic and data operations
 * - Service export for cross-module incident functionality
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Incident]),
        forwardRef(() => AlertModule),
        UserModule,
    ],
    controllers: [IncidentController],
    providers: [IncidentService],
    exports: [IncidentService],
})
export class IncidentModule {}