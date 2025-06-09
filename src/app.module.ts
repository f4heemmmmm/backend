// backend/src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";

import appConfig from "./config/app.config";
import { AppService } from "./app.service";
import { AppController } from "./app.controller";
import { UserModule } from "./modules/user/user.module";
import { AlertModule } from "./modules/alert/alert.module";
import { CSVParserUtil } from "./common/utils/csv-parser.util";
import { IncidentModule } from "./modules/incident/incident.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { CSVMonitorService } from "./common/services/csv-monitor.service";

/**
 * AppModule as the root module for enterprise insider threat monitoring system.
 * 
 * Configures comprehensive application architecture including:
 * - Global configuration management with environment variable expansion
 * - Async TypeORM database connection with configuration service integration
 * - JWT authentication module for secure user management
 * - Core business modules for incidents, alerts, and analytics
 * - CSV monitoring services for real-time data processing
 * - Shared utilities and services across all application modules
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
            useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
                const dbConfig = configService.get("config.database") as TypeOrmModuleOptions;
                return dbConfig;
            },
            inject: [ConfigService],
        }),
        UserModule,
        IncidentModule,
        AlertModule,
        AnalyticsModule,
    ],
    controllers: [AppController],
    providers: [AppService, CSVMonitorService, CSVParserUtil]
})
export class AppModule {}