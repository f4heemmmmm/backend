// backend/src/entities/alert/alert.module.ts

import { Alert } from "./alert.entity";
import { AlertService } from "./alert.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module, forwardRef } from "@nestjs/common";
import { AlertController } from "./alert.controller";
import { IncidentModule } from "../incident/incident.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Alert]),
        forwardRef(() => IncidentModule),
    ],
    controllers: [AlertController],
    providers: [AlertService],
    exports: [AlertService],
})
export class AlertModule {}