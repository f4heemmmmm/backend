// backend/src/analytics/analytics.module.ts

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnalyticsService } from "./analytics.service";
import { Alert } from "src/entities/alert/alert.entity";
import { AnalyticsController } from "./analytics.controller";
import { Incident } from "src/entities/incident/incident.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Alert, Incident])],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService]
})
export class AnalyticsModule {}