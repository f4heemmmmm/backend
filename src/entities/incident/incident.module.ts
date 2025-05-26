// backend/src/entities/incident/incident.module.ts

import { Incident } from './incident.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertModule } from '../alert/alert.module';
import { Module, forwardRef } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Incident]),
        forwardRef(() => AlertModule),
    ],
    controllers: [IncidentController],
    providers: [IncidentService],
    exports: [IncidentService],
})
export class IncidentModule {}