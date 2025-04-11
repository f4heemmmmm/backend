import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import appConfig from "./config/app.config";
import { AppController } from "./app.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";

// Alert Files Import
import { AlertModule } from "./entities/alert/alert.module";

// Incident Files Import
import { IncidentModule } from "./entities/incident/incident.module";
import { CSVMonitorService } from "./services/csv-monitor.service";
import { CSVParserUtil } from "./utils/csv-parser.util";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => 
                configService.get("config.database") as TypeOrmModuleOptions,
            inject: [ConfigService],
        }),
        IncidentModule,
        AlertModule,
    ],
    controllers: [AppController],
    providers: [AppService, CSVMonitorService, CSVParserUtil]
})

export class AppModule {};