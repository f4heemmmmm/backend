// backend/src/modules/alert/alert.module.ts
import { Alert } from "./alert.entity";
import { AlertService } from "./alert.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "../user/user.module";
import { Module, forwardRef } from "@nestjs/common";
import { AlertController } from "./alert.controller";
import { IncidentModule } from "../incident/incident.module";

/**
 * AlertModule for security alert management with incident correlation.
 * 
 * Provides modular alert functionality including:
 * - TypeORM entity registration for database operations
 * - Circular dependency resolution with IncidentModule using forwardRef
 * - JWT authentication integration through UserModule
 * - Alert service export for use in other modules
 */
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