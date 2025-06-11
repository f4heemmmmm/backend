// backend/src/modules/incident/incident.module.ts
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module, forwardRef } from "@nestjs/common";

import { Incident } from "./incident.entity";
import { UserModule } from "../user/user.module";
import { AlertModule } from "../alert/alert.module";
import { IncidentService } from "./incident.service";
import { IncidentController } from "./incident.controller";
import { IncidentComment } from "./comment/incident-comment.entity";
import { IncidentStatusHistory } from "./status-history/incident-status-history.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Incident, IncidentStatusHistory, IncidentComment]),
        forwardRef(() => AlertModule),
        UserModule,
    ],
    controllers: [IncidentController],
    providers: [IncidentService],
    exports: [IncidentService],
})
export class IncidentModule {}