import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Alert Files Import
import { Alert } from "./alert.entity";
import { AlertService } from "./alert.service";
import { AlertController } from "./alert.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Alert])],
    controllers: [AlertController],
    providers: [AlertService],
    exports: [AlertService],
})

export class AlertModule {};