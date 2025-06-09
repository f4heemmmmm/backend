"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const app_config_1 = require("./config/app.config");
const app_controller_1 = require("./app.controller");
const user_module_1 = require("./entities/user/user.module");
const csv_parser_util_1 = require("./utils/csv-parser.util");
const alert_module_1 = require("./entities/alert/alert.module");
const config_1 = require("@nestjs/config");
const analytics_module_1 = require("./analytics/analytics.module");
const csv_monitor_service_1 = require("./services/csv-monitor.service");
const incident_module_1 = require("./entities/incident/incident.module");
const typeorm_1 = require("@nestjs/typeorm");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default],
                cache: true,
                expandVariables: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const dbConfig = configService.get("config.database");
                    return dbConfig;
                },
                inject: [config_1.ConfigService],
            }),
            user_module_1.UserModule,
            incident_module_1.IncidentModule,
            alert_module_1.AlertModule,
            analytics_module_1.AnalyticsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, csv_monitor_service_1.CSVMonitorService, csv_parser_util_1.CSVParserUtil]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map