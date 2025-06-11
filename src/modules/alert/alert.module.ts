// backend/src/modules/alert/alert.module.ts
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module, forwardRef } from "@nestjs/common";

import { Alert } from "./alert.entity";
import { AlertService } from "./alert.service";
import { UserModule } from "../user/user.module";
import { AlertController } from "./alert.controller";
import { IncidentModule } from "../incident/incident.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Alert]),
        forwardRef(() => IncidentModule),
        UserModule,
    ],
    controllers: [AlertController],
    providers: [AlertService],
    exports: [AlertService],
})
export class AlertModule {}