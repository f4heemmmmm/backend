// backend/src/modules/analytics/analytics.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Alert } from "../alert/alert.entity";
import { UserModule } from "../user/user.module";
import { AnalyticsService } from "./analytics.service";
import { Incident } from "../incident/incident.entity";
import { AnalyticsController } from "./analytics.controller";

/**
 * AnalyticsModule for security analytics and reporting functionality.
 * 
 * Provides comprehensive analytics capabilities including:
 * - TypeORM entity registration for Alert and Incident data access
 * - JWT authentication integration through UserModule
 * - Analytics service for data aggregation and statistical analysis
 * - Controller endpoints for enterprise security reporting
 * - Service export for use in other modules requiring analytics
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Alert, Incident]),
        UserModule,
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService]
})
export class AnalyticsModule {}