import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Incident Files Import
import { Incident } from "./incident.entity";
import { IncidentService } from "./incident.service";
import { IncidentController } from "./incident.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Incident])],
    controllers: [IncidentController],
    providers: [IncidentService],
    exports: [IncidentService]
})

export class IncidentModule {};