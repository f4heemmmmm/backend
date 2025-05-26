// backend/src/app.module.ts

import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import appConfig from "./config/app.config";
import { AppController } from "./app.controller";
import { CSVParserUtil } from "./utils/csv-parser.util";
import { AlertModule } from "./entities/alert/alert.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AnalyticsModule } from "./analytics/analytics.module";
import { CSVMonitorService } from "./services/csv-monitor.service";
import { IncidentModule } from "./entities/incident/incident.module";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";

/**
 * Root application module that configures all services, controllers, and modules
 * Sets up database connection, CSV monitoring, and all feature modules
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            cache: true,
            expandVariables: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => 
                configService.get("config.database") as TypeOrmModuleOptions,
            inject: [ConfigService],
        }),
        IncidentModule,
        AlertModule,
        AnalyticsModule,
    ],
    controllers: [AppController],
    providers: [AppService, CSVMonitorService, CSVParserUtil]
})
export class AppModule {}