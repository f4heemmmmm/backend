// backend/src/modules/analytics/analytics.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Alert } from "../alert/alert.entity";
import { UserModule } from "../user/user.module";
import { AnalyticsService } from "./analytics.service";
import { Incident } from "../incident/incident.entity";
import { AnalyticsController } from "./analytics.controller";

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